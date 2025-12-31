import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { User } from "../models/User.js";
// Import consolidated models from models/Product.js
import {
  Product,
  Category,
  Color,
  AgeGroup,
  Photo,
} from "../models/Product.js";
import { Testimonial } from "../models/Testimonial.js";
import { Blog } from "../models/Blog.js";

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

// Load JSON data
const loadJSONFile = (filename) => {
  const filePath = path.join(__dirname, "data", filename);
  const rawData = fs.readFileSync(filePath);
  return JSON.parse(rawData);
};

// Simple slug generator: lowercases, replaces spaces with hyphens, strips non-alphanum/-
const makeSlugBase = (name) =>
  name
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const ensureUniqueSlug = async (base, Model, existingSlugsSet = new Set()) => {
  let slug = base;
  let tries = 0;

  // Check against the local set first (batch uniqueness) then DB
  while (existingSlugsSet.has(slug) || (await Model.findOne({ slug }))) {
    const randomNum = Math.floor(100 + Math.random() * 900); // 3-digit
    slug = `${base}-${randomNum}`;
    tries += 1;
    if (tries > 10) break; // safety
  }

  existingSlugsSet.add(slug);
  return slug;
};

// Clear all data from database
const clearDatabase = async () => {
  try {
    await User.deleteMany({});
    await Product.deleteMany({});
    await Photo.deleteMany({});
    await Category.deleteMany({});
    await Color.deleteMany({});
    await AgeGroup.deleteMany({});
    await Testimonial.deleteMany({});
    await Blog.deleteMany({});
    console.log("🗑️  Database cleared");
  } catch (error) {
    console.error("❌ Error clearing database:", error.message);
    throw error;
  }
};

// Seed Users
const seedUsers = async () => {
  try {
    const usersData = loadJSONFile("users.json");
    const users = [];

    for (const userData of usersData) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      users.push({
        ...userData,
        password: hashedPassword,
      });
    }

    const createdUsers = await User.insertMany(users);
    console.log(`✅ Seeded ${createdUsers.length} users`);
    return createdUsers;
  } catch (error) {
    console.error("❌ Error seeding users:", error.message);
    throw error;
  }
};

// Seed Categories
const seedCategories = async () => {
  try {
    const categoriesData = loadJSONFile("categories.json");
    // generate slugs and ensure uniqueness within this batch
    const slugs = new Set();
    const categoriesToInsert = [];
    for (const cat of categoriesData) {
      const base = makeSlugBase(cat.name || cat.categoryName || "");
      const slug = await ensureUniqueSlug(base, Category, slugs);
      categoriesToInsert.push({ ...cat, slug });
    }
    const createdCategories = await Category.insertMany(categoriesToInsert);
    console.log(`✅ Seeded ${createdCategories.length} categories`);
    return createdCategories;
  } catch (error) {
    console.error("❌ Error seeding categories:", error.message);
    throw error;
  }
};

// Seed Colors
const seedColors = async () => {
  try {
    const colorsData = loadJSONFile("colors.json");
    const slugs = new Set();
    const colorsToInsert = [];
    for (const c of colorsData) {
      const base = makeSlugBase(c.name || "");
      const slug = await ensureUniqueSlug(base, Color, slugs);
      colorsToInsert.push({ ...c, slug });
    }
    const createdColors = await Color.insertMany(colorsToInsert);
    console.log(`✅ Seeded ${createdColors.length} colors`);
    return createdColors;
  } catch (error) {
    console.error("❌ Error seeding colors:", error.message);
    throw error;
  }
};

// Seed Age Groups
const seedAgeGroups = async () => {
  try {
    const ageGroupsData = loadJSONFile("ageGroups.json");
    const slugs = new Set();
    const ageGroupsToInsert = [];
    for (const ag of ageGroupsData) {
      const base = makeSlugBase(ag.name || "");
      const slug = await ensureUniqueSlug(base, AgeGroup, slugs);
      ageGroupsToInsert.push({ ...ag, slug });
    }
    const createdAgeGroups = await AgeGroup.insertMany(ageGroupsToInsert);
    console.log(`✅ Seeded ${createdAgeGroups.length} age groups`);
    return createdAgeGroups;
  } catch (error) {
    console.error("❌ Error seeding age groups:", error.message);
    throw error;
  }
};

// Seed Photos from products data
const seedPhotos = async (productsData) => {
  // Create Photo docs from product image/imageName fields
  const photosToCreate = [];
  for (const p of productsData) {
    if (p.image) {
      photosToCreate.push({
        url: p.image,
        name: p.imageName || p.name || "photo",
        altText: p.name || "Product image",
      });
    }
  }

  // Insert photos and build map
  const createdPhotos = await Photo.insertMany(photosToCreate);
  const photoMap = new Map();
  for (let i = 0; i < createdPhotos.length; i++) {
    const photo = createdPhotos[i];
    photoMap.set(photo.name, photo._id);
    photoMap.set(photo.url, photo._id);
  }
  console.log(`✅ Created ${createdPhotos.length} photo documents`);
  return photoMap;
};

// Seed Products with SKU-based structure
const seedProducts = async (
  users,
  categories,
  colors,
  ageGroups,
  photosMap,
  productsData
) => {
  try {
    const adminUser = users.find((user) => user.role === "admin");

    if (!adminUser) {
      throw new Error("Admin user not found");
    }

    // Create a map for easy lookup
    const categoryMap = {};
    categories.forEach((cat) => {
      categoryMap[cat.name || cat.categoryName] = cat._id;
    });

    const colorMap = {};
    colors.forEach((col) => {
      colorMap[col.name || col.colorName] = col._id;
    });

    const ageGroupMap = {};
    ageGroups.forEach((ag) => {
      ageGroupMap[ag.name || ag.ageGroupName] = ag._id;
    });

    const slugs = new Set();
    const productsToCreate = [];

    for (const productData of productsData) {
      // Generate unique slug
      const base = makeSlugBase(
        productData.name || productData.productName || "product"
      );
      const slug = await ensureUniqueSlug(base, Product, slugs);

      // Get photo ID
      const photoId =
        photosMap.get(productData.imageName) ||
        photosMap.get(productData.image);

      // Get category ID
      const categoryId = categoryMap[productData.category];

      // Parse features
      const features = Array.isArray(productData.features)
        ? productData.features
        : [];

      // Get color and age group IDs
      const colorId = colorMap[productData.color];
      const ageGroupId = ageGroupMap[productData.ageGroup];

      // Create product with new structure
      const product = new Product({
        name: productData.name || productData.productName,
        slug,
        description:
          productData.description || productData.productDescription || "",
        shortDescription:
          productData.shortDescription ||
          productData.description?.substring(0, 150),
        features,
        categories: categoryId ? [categoryId] : [],
        tags: productData.tags || ["new", "bestseller"], // Valid tags only
        baseImages: photoId ? [photoId] : [],
        basePrice: Number(productData.price) || 0,
        metadata: {
          brand: productData.brand || "Just Born Garments",
          gender: productData.gender || "unisex",
          material: productData.material || "Cotton",
          careInstructions:
            productData.careInstructions || "Machine wash cold, tumble dry low",
        },
        seo: {
          metaTitle: productData.metaTitle || productData.name,
          metaDescription:
            productData.metaDescription ||
            productData.description?.substring(0, 160),
          keywords:
            productData.keywords ||
            [
              productData.category,
              productData.color,
              productData.ageGroup,
            ].filter(Boolean),
        },
        status: {
          isPublished:
            productData.status !== undefined ? productData.status : true,
          isActive: true,
          isFeatured: productData.featured || false,
        },
        createdBy: adminUser._id,
      });

      // Save product first to get the ID
      await product.save();

      // Create SKU if we have color and age group
      if (colorId && ageGroupId) {
        const skuId = `SKU-${slug.toUpperCase()}-${productData.color
          ?.substring(0, 3)
          .toUpperCase()}-${productData.ageGroup
          ?.substring(0, 3)
          .toUpperCase()}`;

        const sku = {
          skuId,
          ageGroup: ageGroupId,
          color: colorId,
          pricing: {
            retail: Number(productData.price) || 0,
            wholesale: productData.wholesale
              ? {
                  price: Number(productData.wholesale.price) || 0,
                  minQuantity: 12,
                  unit: "dozen", // Valid enum: piece, dozen, set
                }
              : undefined,
            cost:
              productData.costPrice ||
              Math.floor(Number(productData.price) * 0.6), // 60% of retail as default cost
          },
          inventory: {
            stock: productData.stockQuantity || 100,
            reserved: 0,
            lowStockThreshold: 10,
          },
          specifications: {
            weight: { value: 150, unit: "g" },
            dimensions: { length: 30, width: 25, height: 2, unit: "cm" },
          },
          status: true,
        };

        product.skus.push(sku);
        await product.save();
      }

      productsToCreate.push(product);
    }

    console.log(`✅ Seeded ${productsToCreate.length} products with SKUs`);
    return productsToCreate;
  } catch (error) {
    console.error("❌ Error seeding products:", error.message);
    throw error;
  }
};

// Seed testimonials
const seedTestimonials = async () => {
  try {
    const testimonialsData = await loadJSONFile("testimonials.json");

    // Get admin user for approvedBy
    const adminUser = await User.findOne({ email: "admin@justborn.com" });
    if (!adminUser) {
      throw new Error("Admin user not found. Please seed users first.");
    }

    // Get users for testimonials
    const userEmails = testimonialsData.map((t) => t.userEmail);
    const users = await User.find({ email: { $in: userEmails } });
    const userMap = {};
    users.forEach((user) => {
      userMap[user.email] = user._id;
    });

    const testimonials = testimonialsData.map((testimonial) => ({
      userId: userMap[testimonial.userEmail],
      text: testimonial.text,
      rating: testimonial.rating,
      createdBy: userMap[testimonial.userEmail],
      approvedBy: adminUser._id,
      status: testimonial.status,
      priority: testimonial.priority,
    }));

    const createdTestimonials = await Testimonial.insertMany(testimonials);
    console.log(`✅ Seeded ${createdTestimonials.length} testimonials`);
    return createdTestimonials;
  } catch (error) {
    console.error("❌ Error seeding testimonials:", error.message);
    throw error;
  }
};

// Seed blogs
const seedBlogs = async () => {
  try {
    const blogsData = await loadJSONFile("blogs.json");

    // Get admin user for createdBy
    const adminUser = await User.findOne({ email: "admin@justborn.com" });
    if (!adminUser) {
      throw new Error("Admin user not found. Please seed users first.");
    }

    const blogs = blogsData.map((blog) => ({
      title: blog.title,
      content: blog.content,
      images: blog.images,
      status: blog.status,
      createdBy: adminUser._id,
    }));

    const createdBlogs = await Blog.insertMany(blogs);
    console.log(`✅ Seeded ${createdBlogs.length} blogs`);
    return createdBlogs;
  } catch (error) {
    console.error("❌ Error seeding blogs:", error.message);
    throw error;
  }
};

// Main seeder function
const seedDatabase = async () => {
  try {
    console.log("\n🌱 Starting database seeding...\n");

    await connectDB();
    await clearDatabase();

    console.log("\n📦 Seeding data...\n");

    const users = await seedUsers();
    const categories = await seedCategories();
    const colors = await seedColors();
    const ageGroups = await seedAgeGroups();
    const productsData = loadJSONFile("products.json");
    const photosMap = await seedPhotos(productsData);
    await seedProducts(
      users,
      categories,
      colors,
      ageGroups,
      photosMap,
      productsData
    );
    const testimonials = await seedTestimonials();
    const blogs = await seedBlogs();

    console.log("\n✨ Database seeding completed successfully!\n");
    console.log("📊 Summary:");
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Colors: ${colors.length}`);
    console.log(`   - Age Groups: ${ageGroups.length}`);
    console.log(`   - Products: ${await Product.countDocuments()}`);
    console.log(`   - Testimonials: ${testimonials.length}`);
    console.log(`   - Blogs: ${blogs.length}`);
    console.log("\n🔐 Test Credentials:");
    console.log("   Admin:");
    console.log("     Email: admin@justborn.com");
    console.log("     Password: Admin@123");
    console.log("   User:");
    console.log("     Email: john.doe@example.com");
    console.log("     Password: User@123");
    console.log("   Wholesaler:");
    console.log("     Email: wholesale1@example.com");
    console.log("     Password: Wholesale@123\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Seeding failed:", error.message);
    process.exit(1);
  }
};

// Dry-run validator: simulates seeding steps without DB access
const dryRunSeed = async () => {
  console.log("\n🧪 Running seeder dry-run (no DB operations)\n");

  const categoriesData = loadJSONFile("categories.json");
  const colorsData = loadJSONFile("colors.json");
  const ageGroupsData = loadJSONFile("ageGroups.json");
  const productsData = loadJSONFile("products.json");

  // generate slugs
  const makeSlug = (name) => makeSlugBase(name || "");

  const categories = categoriesData.map((c) => ({
    ...c,
    slug: makeSlug(c.name),
  }));
  const colors = colorsData.map((c) => ({ ...c, slug: makeSlug(c.name) }));
  const ageGroups = ageGroupsData.map((a) => ({
    ...a,
    slug: makeSlug(a.name),
  }));

  // photos map simulation
  const photos = productsData.map((p, i) => ({
    id: `photo-${i + 1}`,
    name: p.imageName || p.name,
    url: p.image,
  }));
  const photoMap = new Map();
  photos.forEach((ph) => {
    photoMap.set(ph.name, ph.id);
    photoMap.set(ph.url, ph.id);
  });

  // categories/colors/ageGroup maps
  const colorMap = new Map(colors.map((c) => [c.name, `color-${c.slug}`]));
  const ageMap = new Map(ageGroups.map((a) => [a.name, `age-${a.slug}`]));

  // Transform a few sample products
  const transformed = productsData.slice(0, 5).map((product) => {
    const photoId =
      photoMap.get(product.imageName) || photoMap.get(product.image);
    const agId = ageMap.get(product.ageGroup);
    const colId = colorMap.get(product.color);
    const ageGroupSize = agId
      ? [
          {
            wholesaleId: product.wholesale ? product.wholesale.id : undefined,
            ageSizeMeta: agId,
            colours: colId
              ? [
                  {
                    colourMeta: colId,
                    photoList: photoId ? [photoId] : [],
                    stock: product.stockQuantity || 0,
                  },
                ]
              : [],
          },
        ]
      : [];

    return {
      name: product.name,
      description: product.description,
      photoList: photoId ? [photoId] : [],
      price: Number(product.price),
      ageGroupSize,
    };
  });

  console.log("Categories to insert:", categories.length);
  console.log("Colors to insert:", colors.length);
  console.log("Age groups to insert:", ageGroups.length);
  console.log("Photos to insert:", photos.length);
  console.log("Products to insert (sample):", transformed.length);
  console.log("\nSample transformed product object (first):");
  console.log(JSON.stringify(transformed[0], null, 2));
  console.log("\n✅ Dry-run completed — no DB changes made");
};

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes("--clear") || args.includes("-c")) {
  // Only clear database
  connectDB()
    .then(clearDatabase)
    .then(() => {
      console.log("✅ Database cleared successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Error:", error.message);
      process.exit(1);
    });
} else {
  if (args.includes("--dry-run") || args.includes("-d")) {
    dryRunSeed().then(() => process.exit(0));
  } else {
    // Run full seeding
    seedDatabase();
  }
}
