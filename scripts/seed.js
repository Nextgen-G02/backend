import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from '../models/user.js';
import Category from '../models/category.model.js';
import Product from '../models/product.model.js';
import Inventory from '../models/Inventory.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const productsData = [
  // Cakes (10)
  { productId: 'P001', pName: 'Dark Chocolate Ganache', pCategory: 'Cakes', description: 'Rich 70% dark chocolate ganache cake.', price: 3500, weight: 1, stock: 15, isCustomizable: true, flavors: ['Dark Chocolate', 'Hazelnut'], images: ['https://images.unsplash.com/photo-1578985545062-69928b1d9587'] },
  { productId: 'P002', pName: 'Strawberry Shortcake', pCategory: 'Cakes', description: 'Fresh strawberries with whipped cream.', price: 2800, weight: 1, stock: 10, isCustomizable: true, flavors: ['Vanilla', 'Strawberry'], images: ['https://images.unsplash.com/photo-1565958011703-44f9829ba187'] },
  { productId: 'P003', pName: 'Blueberry Cheesecake', pCategory: 'Cakes', description: 'Creamy New York style cheesecake with blueberry topping.', price: 4200, weight: 1.5, stock: 5, isCustomizable: false, images: ['https://images.unsplash.com/photo-1533134242443-d4fd215305ad'] },
  { productId: 'P004', pName: 'Tiramisu cake', pCategory: 'Cakes', description: 'Classic Italian coffee-flavored dessert.', price: 3800, weight: 1, stock: 8, isCustomizable: false, images: ['https://images.unsplash.com/photo-1571115177098-24ec42ed204d'] },
  { productId: 'P005', pName: 'Red Velvet Royale', pCategory: 'Cakes', description: 'Velvety red sponge with cream cheese frosting.', price: 3200, weight: 1, stock: 12, isCustomizable: true, flavors: ['Classic', 'White Chocolate'], images: ['https://images.unsplash.com/photo-1586788680434-30d324671b1c'] },
  { productId: 'P006', pName: 'Lemon Meringue Cake', pCategory: 'Cakes', description: 'Zesty lemon curd with toasted meringue.', price: 2900, weight: 1, stock: 7, isCustomizable: false, images: ['https://images.unsplash.com/photo-1519340333755-96696db86e92'] },
  { productId: 'P007', pName: 'Caramel Crunch Cake', pCategory: 'Cakes', description: 'Salted caramel with crunchy honeycomb.', price: 3400, weight: 1, stock: 9, isCustomizable: true, flavors: ['Sea Salt Caramel', 'Toffee'], images: ['https://images.unsplash.com/photo-1557925923-33b27f891f88'] },
  { productId: 'P008', pName: 'Black Forest Gateau', pCategory: 'Cakes', description: 'Chocolate sponge with cherries and kirsch.', price: 3100, weight: 1, stock: 11, isCustomizable: false, images: ['https://images.unsplash.com/photo-1606312619070-d48b4c652a52'] },
  { productId: 'P009', pName: 'Vanilla Bean Perfection', pCategory: 'Cakes', description: 'Madagascar vanilla bean sponge and frosting.', price: 2500, weight: 1, stock: 20, isCustomizable: true, flavors: ['Bourbon Vanilla', 'Spiced Vanilla'], images: ['https://images.unsplash.com/photo-1464349153735-7db50ed83c84'] },
  { productId: 'P010', pName: 'Coffee Mocha Blast', pCategory: 'Cakes', description: 'Rich espresso infused chocolate cake.', price: 3300, weight: 1, stock: 6, isCustomizable: true, flavors: ['Espresso', 'Cappuccino'], images: ['https://images.unsplash.com/photo-1534073828943-f801091bbff8'] },
  
  // Savories (10)
  { productId: 'P011', pName: 'Chicken Puff Pastry', pCategory: 'Savories', description: 'Flaky pastry filled with creamy chicken.', price: 120, weight: 0.1, stock: 50, isCustomizable: false, images: ['https://images.unsplash.com/photo-1608198093002-ad4e005484ec'] },
  { productId: 'P012', pName: 'Mutton Roll', pCategory: 'Savories', description: 'Spiced mutton wrapped in a crunchy coating.', price: 150, weight: 0.12, stock: 40, isCustomizable: false, images: ['https://images.unsplash.com/photo-1601050690597-df056fb04791'] },
  { productId: 'P013', pName: 'Veggie Samosa (Large)', pCategory: 'Savories', description: 'Crispy triangle pastry with spiced vegetables.', price: 80, weight: 0.08, stock: 60, isCustomizable: false, images: ['https://images.unsplash.com/photo-1601050690597-df056fb04791'] },
  { productId: 'P014', pName: 'Egg & Seeni Bun', pCategory: 'Savories', description: 'Sri Lankan style sweet & spicy onion bun with egg.', price: 100, weight: 0.15, stock: 35, isCustomizable: false, images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff'] },
  { productId: 'P015', pName: 'Fish Cutlet (6 pcs)', pCategory: 'Savories', description: 'Spiced fish balls crumbed and deep fried.', price: 450, weight: 0.3, stock: 25, isCustomizable: false, images: ['https://images.unsplash.com/photo-1541529086526-db283c563270'] },
  { productId: 'P016', pName: 'Beef Pasty', pCategory: 'Savories', description: 'Minced beef with potatoes and carrots in shortcrust.', price: 180, weight: 0.2, stock: 30, isCustomizable: false, images: ['https://images.unsplash.com/photo-1574083756209-77558ec4312c'] },
  { productId: 'P017', pName: 'Sausage Roll Deluxe', pCategory: 'Savories', description: 'Premium chicken sausage wrapped in puff pastry.', price: 140, weight: 0.12, stock: 45, isCustomizable: false, images: ['https://images.unsplash.com/photo-1544025162-d76694265947'] },
  { productId: 'P018', pName: 'Mini Chicken Pizza', pCategory: 'Savories', description: 'Handcrafted mini pizza with spiced chicken topping.', price: 200, weight: 0.15, stock: 20, isCustomizable: false, images: ['https://images.unsplash.com/photo-1513104890138-7c749659a591'] },
  { productId: 'P019', pName: 'Quiche Lorraine', pCategory: 'Savories', description: 'Classic ham and cheese egg tart.', price: 350, weight: 0.18, stock: 15, isCustomizable: false, images: ['https://images.unsplash.com/photo-1608039755401-742bc2616259'] },
  { productId: 'P020', pName: 'Bacon turnover', pCategory: 'Savories', description: 'Smoky bacon and melted cheese in a turnover pastry.', price: 220, weight: 0.15, stock: 20, isCustomizable: false, images: ['https://images.unsplash.com/photo-1608198093002-ad4e005484ec'] },

  // Sweets (5)
  { productId: 'P021', pName: 'Macarons (12pcs)', pCategory: 'Sweets', description: 'Exquisite French macarons in various flavors.', price: 2400, weight: 0.3, stock: 10, isCustomizable: false, images: ['https://images.unsplash.com/photo-1558321689-509311656f61'] },
  { productId: 'P022', pName: 'Choc Brownies', pCategory: 'Sweets', description: 'Fudgy brownies with chocolate chunks.', price: 250, weight: 0.1, stock: 30, isCustomizable: false, images: ['https://images.unsplash.com/photo-1461008312963-30bb699a4ee4'] },
  { productId: 'P023', pName: 'Coconut Rock (Bulk)', pCategory: 'Sweets', description: 'Traditional Sri Lankan Pol Toffee.', price: 400, weight: 0.25, stock: 40, isCustomizable: false, images: ['https://images.unsplash.com/photo-1582208942761-419106950004'] },
  { productId: 'P024', pName: 'Glazed Donuts', pCategory: 'Sweets', description: 'Soft fluffy donuts with classic glaze.', price: 120, weight: 0.08, stock: 50, isCustomizable: false, images: ['https://images.unsplash.com/photo-1551024601-bec78aea704b'] },
  { productId: 'P025', pName: 'Fruit Tartlet', pCategory: 'Sweets', description: 'Crunchy tart shell with custard and fresh fruit.', price: 300, weight: 0.12, stock: 15, isCustomizable: false, images: ['https://images.unsplash.com/photo-1488477181946-6428a0291777'] },

  // Beverages (5)
  { productId: 'P026', pName: 'Caramel Macchiato', pCategory: 'Beverages', description: 'Rich espresso with caramel and cold milk.', price: 650, weight: 0.3, stock: 100, isCustomizable: false, images: ['https://images.unsplash.com/photo-1461023058943-07fcbe16d735'] },
  { productId: 'P027', pName: 'Ceylon Milk Tea', pCategory: 'Beverages', description: 'Authentic Sri Lankan milk tea with cardamon.', price: 180, weight: 0.25, stock: 150, isCustomizable: false, images: ['https://images.unsplash.com/photo-1544787210-22209799697d'] },
  { productId: 'P028', pName: 'Passion Fruit Juice', pCategory: 'Beverages', description: 'Tangy and refreshing passion fruit juice.', price: 350, weight: 0.3, stock: 80, isCustomizable: false, images: ['https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd'] },
  { productId: 'P029', pName: 'Matcha Tea Latte', pCategory: 'Beverages', description: 'Premium Japanese matcha with steamed milk.', price: 750, weight: 0.3, stock: 40, isCustomizable: false, images: ['https://images.unsplash.com/photo-1515823064-d6e0c04616a7'] },
  { productId: 'P030', pName: 'Oreo Milkshake', pCategory: 'Beverages', description: 'Creamy milkshake with crushed Oreo cookies.', price: 550, weight: 0.35, stock: 30, isCustomizable: false, images: ['https://images.unsplash.com/photo-1572490122747-3968b75cc699'] }
];

const seedData = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        console.log('Clearing old products and inventory...');
        await Promise.all([
            Product.deleteMany({}),
            Inventory.deleteMany({})
        ]);

        // Seed Users if they don't exist
        console.log('Seeding Users...');
        const adminPassword = await bcrypt.hash('Admin@321', 10);
        const staffPassword = await bcrypt.hash('Staff@321', 10);
        const usersToSeed = [
            { firstName: 'System', lastName: 'Admin', email: 'admin@gmail.com', password: adminPassword, role: 'admin' },
            { firstName: 'Sample', lastName: 'Staff', email: 'staff@gmail.com', password: staffPassword, role: 'staff' }
        ];
        for (const user of usersToSeed) {
            await User.findOneAndUpdate({ email: user.email }, user, { upsert: true, new: true });
        }

        // Seed Categories
        console.log('Seeding Categories...');
        const categoriesToSeed = [
            { name: 'Cakes', description: 'Premium celebration cakes' },
            { name: 'Sweets', description: 'Traditional Sri Lankan delicacies' },
            { name: 'Beverages', description: 'Fresh juices and hot drinks' },
            { name: 'Savories', description: 'Tea time snacks and pastries' }
        ];
        for (const cat of categoriesToSeed) {
            await Category.findOneAndUpdate({ name: cat.name }, cat, { upsert: true, new: true });
        }

        // Seed Products
        console.log('Seeding Products...');
        for (const prod of productsData) {
            const product = await Product.create(prod);
            
            // Seed Inventory for this product
            await Inventory.create({ 
                productId: product._id,
                productName: product.pName,
                quantity: product.stock,
                lowStockLevel: 5 
            });
        }

        console.log(`Seeding completed successfully! Added ${productsData.length} products.`);
        process.exit(0);

    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedData();
