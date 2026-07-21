const mongoose = require('mongoose');
try { require('dns').setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}

// MongoDB Atlas URI
const MONGO_URI = 'mongodb+srv://Yugam:Yugam006@cluster0.5dogq5t.mongodb.net/clothing-store?retryWrites=true&w=majority';

// Import Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  images: [String],
  category: String,
  department: { type: String, enum: ['Men', 'Women', 'Kids', 'Accessories'] },
  description: String,
  variants: {
    sizes: [String],
    colors: [String]
  },
  stock: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

// The Core Catalog Data (Extracted from frontend/src/data/products.js)
const originalProducts = [
  {
    name: "The Signature Leather Jacket",
    price: 18499,
    description: "Crafted with precision. A perfect blend of style, comfort, and ethically sourced premium calfskin.",
    category: "Outerwear",
    department: "Men",
    image: "/products/featured_jacket_1774521192904.png",
    variants: { sizes: ["S", "M", "L", "XL", "XXL"], colors: ["Black", "Chocolate Brown"] },
    stock: 12,
    isFeatured: true
  },
  {
    name: "Classic Heritage Denim",
    price: 8999,
    description: "Timeless style meets modern comfort. Heritage denim jeans with a tailored, flattering fit.",
    category: "Bottoms",
    department: "Men",
    image: "/products/classic_jeans_1774521377317.png",
    variants: { sizes: ["30", "32", "34", "36", "38"], colors: ["Indigo", "Light Wash", "Black"] },
    stock: 25,
    isFeatured: false
  },
  {
    name: "Minimalist Egyptian T-Shirt",
    price: 4599,
    description: "Woven from 100% Egyptian cotton for an incredibly soft, breathable feel. The ultimate luxury basic.",
    category: "Tops",
    department: "Men",
    image: "/products/premium_tshirt_1774521354070.png",
    variants: { sizes: ["S", "M", "L", "XL"], colors: ["White", "Charcoal", "Navy"] },
    stock: 50,
    isFeatured: false
  },
  {
    name: "Tailored Velvet Party Blazer",
    price: 14999,
    description: "A striking slim-fit velvet blazer designed specifically for evening events and high-end partywear.",
    category: "Outerwear",
    department: "Men",
    image: "/products/mens_velvet_blazer_1774556149570.png",
    stock: 15,
    isFeatured: true
  },
  {
    name: "Premium Black Graphic Tee",
    price: 3499,
    description: "A heavy-weight cotton t-shirt featuring a subtle, high-density minimalist graphic print.",
    category: "Tops",
    department: "Men",
    image: "/products/mens_graphic_tee_1774556163917.png",
    stock: 20
  },
  {
    name: "Vintage Washed Denim Jacket",
    price: 10999,
    description: "Rugged, durable denim treated with a specialized vintage wash for a perfectly broken-in look.",
    category: "Outerwear",
    department: "Men",
    image: "/products/mens_vintage_denim_jacket_1774557271290.png",
    stock: 10
  },
  {
    name: "Relaxed Fit Flannel Overshirt",
    price: 5499,
    description: "Ultra-soft brushed flannel. Designed strictly for versatile casual layering.",
    category: "Tops",
    department: "Men",
    image: "/products/mens_flannel_overshirt_1774557288573.png",
    stock: 30
  },
  {
    name: "Oversized Streetwear Hoodie",
    price: 6499,
    description: "A thick, fleece-lined hooded sweatshirt built for ultimate streetwear comfort.",
    category: "Outerwear",
    department: "Men",
    image: "/products/mens_streetwear_hoodie_1774556180237.png",
    stock: 18
  },
  {
    name: "Formal White Dress Shirt",
    price: 6999,
    description: "Crisp, breathable, and perfectly tailored. The definitive white dress shirt for formal occasions.",
    category: "Tops",
    department: "Men",
    image: "/products/mens_white_dress_shirt_1774557305368.png",
    stock: 40
  },
  {
    name: "Silk Evening Party Gown",
    price: 22499,
    description: "Turn heads with this stunning silk gown. Designed to naturally drape for a flawless silhouette.",
    category: "Dresses",
    department: "Women",
    image: "/products/womens_silk_gown_1774556230602.png",
    stock: 5,
    isFeatured: true
  },
  {
    name: "Floral Summer Girlish Top",
    price: 4999,
    description: "A breezy, beautifully patterned floral crop top perfect for casual summer days.",
    category: "Tops",
    department: "Women",
    image: "/products/womens_floral_top_1774556248971.png",
    stock: 22
  },
  {
    name: "Classic Denim Crop Jacket",
    price: 8999,
    description: "Authentic cotton-denim jacket with structural crop styling. Perfect for a casual layering system.",
    category: "Outerwear",
    department: "Women",
    image: "/products/womens_denim_crop_1774557320546.png",
    stock: 14
  },
  {
    name: "Sleek Leather Moto Jacket",
    price: 15999,
    description: "An edgy, beautifully tailored asymmetrical leather jacket for night-out partywear.",
    category: "Outerwear",
    department: "Women",
    image: "/products/womens_leather_jacket_1774556266008.png",
    stock: 8,
    isFeatured: true
  },
  {
    name: "Little Gentleman Tailored Suit",
    price: 8999,
    description: "A complete, adorable 3-piece formal suit featuring suspenders and a bowtie for partywear events.",
    category: "Outerwear",
    department: "Kids",
    image: "/products/kids_formal_suit_1774556284928.png",
    stock: 10,
    isFeatured: true
  },
  {
    name: "Princess Tulle Party Dress",
    price: 6499,
    description: "A magical, multi-layered tulle party dress designed to make her feel like royalty.",
    category: "Dresses",
    department: "Kids",
    image: "/products/kids_party_dress_1774556301558.png",
    stock: 15
  },
  {
    name: "Heavy Winter Puffer Jacket",
    price: 5999,
    description: "Engineered for maximum thermal retention during extreme playground winters.",
    category: "Outerwear",
    department: "Kids",
    image: "/products/kids_puffer_jacket_1774556318480.png",
    stock: 12
  },
  {
    name: "Formal White Ring-Bearer Shirt",
    price: 2899,
    description: "A crisp, miniaturized formal white shirt perfect for weddings or high-end partywear.",
    category: "Tops",
    department: "Kids",
    image: "/products/kids_ring_bearer_1774556337632.png",
    stock: 25
  },
  {
    name: "Midnight Blue Trench Coat",
    price: 19999,
    description: "An incredibly tailored midnight blue trench coat designed for commanding winter weather in absolute sheer luxury.",
    category: "Outerwear",
    department: "Men",
    image: "/products/mens_midnight_trench.png",
    stock: 6,
    isFeatured: true
  },
  {
    name: "High-Performance Chinos",
    price: 6499,
    description: "Engineered khaki chinos with 4-way stretch and structural memory for a flawless tailored fit.",
    category: "Bottoms",
    department: "Men",
    image: "/products/mens_chinos.png",
    stock: 35
  },
  {
    name: "Knitted Olive Polo Shirt",
    price: 5299,
    description: "A breathable luxury knitted polo in olive green. Perfect for high-end golf course aesthetics or casual fridays.",
    category: "Tops",
    department: "Men",
    image: "/products/mens_knit_polo.png",
    stock: 20
  },
  {
    name: "Tan Suede Bomber Jacket",
    price: 24999,
    description: "A masterclass in modern outerwear. Hand-stitched velvet-soft tan suede with a razor-sharp cut.",
    category: "Outerwear",
    department: "Men",
    image: "/products/mens_suede_bomber.png",
    stock: 4,
    isFeatured: true
  },
  {
    name: "Beige Linen Summer Trousers",
    price: 7999,
    description: "Ultra-lightweight breezy linen trousers cut for luxury summer vacations and coastal evenings.",
    category: "Bottoms",
    department: "Men",
    image: "/products/mens_linen_trousers.png",
    stock: 25
  },
  {
    name: "Cream Cashmere Turtleneck",
    price: 13499,
    description: "Experience the ultimate softness. A pure cream cashmere turtleneck for exquisite winter layering.",
    category: "Tops",
    department: "Women",
    image: "/products/womens_cashmere_turtleneck.png",
    stock: 12
  },
  {
    name: "Black Wide-Leg Trousers",
    price: 8499,
    description: "A dramatic, high-waisted wide-leg trouser offering extreme comfort and structural power.",
    category: "Bottoms",
    department: "Women",
    image: "/products/womens_wide_trousers.png",
    stock: 18
  },
  {
    name: "Emerald Green Satin Cocktail Dress",
    price: 18999,
    description: "Steal the show. A flowing emerald green satin cocktail dress cut to catch every single light in the room.",
    category: "Dresses",
    department: "Women",
    image: "/products/womens_emerald_dress.png",
    stock: 7,
    isFeatured: true
  },
  {
    name: "Camel Belted Wool Coat",
    price: 26999,
    description: "An imposing, cinematic camel wool coat with a severe belt wrap. An absolute winter essential.",
    category: "Outerwear",
    department: "Women",
    image: "/products/womens_wool_coat.png",
    stock: 5,
    isFeatured: true
  },
  {
    name: "White Ruffled Silk Blouse",
    price: 11499,
    description: "Ethereal, breathable ruffled silk. Designed to transform any outfit into a Parisian statement.",
    category: "Tops",
    department: "Women",
    image: "/products/womens_silk_blouse.png",
    stock: 15
  },
  {
    name: "Blue Denim Play Overalls",
    price: 4999,
    description: "Tough, durable, adorable blue denim overalls built for serious playground exploration.",
    category: "Outerwear",
    department: "Kids",
    image: "/products/kids_denim_overalls.png",
    stock: 20
  },
  {
    name: "Red Canvas Striped Tee",
    price: 1899,
    description: "A bright, breathable red and white striped cotton tee for everyday adventures.",
    category: "Tops",
    department: "Kids",
    image: "/products/kids_striped_tee.png",
    stock: 50
  },
  {
    name: "Yellow Sunshine Knitted Cardigan",
    price: 3499,
    description: "A bright yellow knitted cardigan to layer over dresses or tees when the weather dips.",
    category: "Outerwear",
    department: "Kids",
    image: "/products/kids_knitted_cardigan.png",
    stock: 15
  },
  {
    name: "Formal Plaid Wool Trousers",
    price: 4299,
    description: "Sophisticated plaid wool trousers shrunk down for your little gentleman's next event.",
    category: "Bottoms",
    department: "Kids",
    image: "/products/kids_plaid_trousers.png",
    stock: 10
  },
  {
    name: "Navy Polka Dot Summer Dress",
    price: 3899,
    description: "A classically charming navy blue dress covered in white polka dots, designed perfectly for summer.",
    category: "Dresses",
    department: "Kids",
    image: "/products/kids_polka_dress.png",
    stock: 25
  }
];

async function migrate() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected! ✅");

    console.log("Wiping existing product catalog...");
    const deleteResult = await Product.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} items. WIPE COMPLETE! 🧹`);

    console.log("Seeding with the original ~32 Boutique products...");
    const insertResult = await Product.insertMany(originalProducts);
    console.log(`Seeded ${insertResult.length} products successfully! 🎉`);

    process.exit(0);
  } catch (err) {
    console.error("MIGRATION FAILED:", err);
    process.exit(1);
  }
}

migrate();
