# Database Seeder

This directory contains scripts and data files for seeding the database with initial data.

## 📁 Structure

```
seeders/
├── seed.js              # Main seeder script
├── data/
│   ├── users.json       # User seed data
│   ├── categories.json  # Category seed data
│   ├── colors.json      # Color seed data
│   ├── ageGroups.json   # Age group seed data
│   └── products.json    # Product seed data
└── README.md
```

## 🚀 Usage

### Seed the entire database

```bash
npm run seed
```

or

```bash
pnpm seed
```

This will:

1. Clear all existing data
2. Seed users (7 users: 1 admin, 4 regular users, 2 wholesalers)
3. Seed categories (7 categories)
4. Seed colors (10 colors)
5. Seed age groups (5 age groups)
6. Seed products (12 products)

### Clear database only

```bash
npm run seed:clear
```

or

```bash
pnpm seed:clear
```

## 🔐 Test Credentials

After seeding, you can use these credentials to test the application:

### Admin User

- **Email:** admin@justborn.com
- **Password:** Admin@123
- **Role:** admin

### Regular User

- **Email:** john.doe@example.com
- **Password:** User@123
- **Role:** user

### Wholesaler User

- **Email:** wholesale1@example.com
- **Password:** Wholesale@123
- **Role:** wholesalerUser

## 📊 Seeded Data Summary

### Users (7)

- 1 Admin
- 4 Regular Users
- 2 Wholesaler Users

### Categories (7)

- T-Shirts
- Rompers
- Dresses
- Pants
- Sleepwear
- Jackets
- Accessories

### Colors (10)

- Red, Blue, Pink, Yellow, Green
- White, Black, Purple, Orange, Gray

### Age Groups (5)

- Newborn (0-3 months)
- Infant (3-12 months)
- Toddler (1-3 years)
- Preschool (3-5 years)
- Kids (5-12 years)

### Products (12)

- Various baby and kids clothing items
- Each with category, color, and age group associations
- Includes retail and wholesale pricing
- Stock quantities included

## 🔧 Customization

To customize the seed data:

1. Edit the JSON files in the `data/` directory
2. Maintain the required structure for each model
3. Run the seeder again

### JSON File Structures

#### users.json

```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "Password123",
  "role": "user|admin|wholesalerUser"
}
```

#### categories.json

```json
{
  "name": "Category Name",
  "description": "Category description",
  "icon": "emoji or icon"
}
```

#### colors.json

```json
{
  "name": "Color Name",
  "colorCode": "#HEXCODE",
  "description": "Color description"
}
```

#### ageGroups.json

```json
{
  "name": "Age Group Name",
  "fromAge": 0,
  "toAge": 12,
  "description": "Age range description"
}
```

#### products.json

```json
{
  "name": "Product Name",
  "description": "Product description",
  "features": ["feature1", "feature2"],
  "category": "Category Name (must match categories.json)",
  "color": "Color Name (must match colors.json)",
  "ageGroup": "Age Group Name (must match ageGroups.json)",
  "image": "image URL",
  "imageName": "image-name.jpg",
  "status": true,
  "price": 299,
  "wholesale": {
    "id": "WHL-XXX-001",
    "price": 2400,
    "perQuantity": "per dozen|per piece"
  },
  "stockQuantity": 100
}
```

## ⚠️ Important Notes

- **Running the seeder will DELETE all existing data**
- Make sure to backup your database before running the seeder on production
- The seeder uses `MONGODB_URI` environment variable from `.env` file for database connection
- Passwords are automatically hashed using bcrypt before insertion

## 🐛 Troubleshooting

### Database connection error

- Ensure MongoDB is running
- Check your `DATABASE_URL` in `.env` file

### Import errors

- Make sure all dependencies are installed: `npm install`
- Verify all model files exist in the `models/` directory

### Data validation errors

- Check that all required fields are present in JSON files
- Ensure referenced data (categories, colors, ageGroups) names match exactly
