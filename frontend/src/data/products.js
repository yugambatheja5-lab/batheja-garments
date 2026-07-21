import featuredJacket from '../assets/featured-jacket.png';
import premiumTshirt from '../assets/premium-tshirt.png';
import classicJeans from '../assets/classic-jeans.png';

export const products = [
  // =====================
  // MENSWEAR DEPARTMENT
  // =====================
  {
    id: "m-1",
    name: "The Signature Leather Jacket",
    price: 18499,
    description: "Crafted with precision. A perfect blend of style, comfort, and ethically sourced premium calfskin.",
    category: "Outerwear",
    department: "Men",
    image: featuredJacket,
    tags: ["New Arrival", "Men", "winter", "leather", "jacket", "partywear"],
    variants: {
      sizes: ["S", "M", "L", "XL", "XXL"],
      colors: ["Black", "Chocolate Brown"]
    },
    stock: 12
  },
  {
    id: "m-2",
    name: "Classic Heritage Denim",
    price: 8999,
    description: "Timeless style meets modern comfort. Heritage denim jeans with a tailored, flattering fit.",
    category: "Bottoms",
    department: "Men",
    image: classicJeans,
    tags: ["Bestseller", "Men", "jeans", "pants", "casual", "denim"],
    variants: {
      sizes: ["30", "32", "34", "36", "38"],
      colors: ["Indigo", "Light Wash", "Black"]
    },
    stock: 25
  },
  {
    id: "m-3",
    name: "Minimalist Egyptian T-Shirt",
    price: 4599,
    description: "Woven from 100% Egyptian cotton for an incredibly soft, breathable feel. The ultimate luxury basic.",
    category: "Tops",
    department: "Men",
    image: premiumTshirt,
    tags: ["summer", "Men", "casual", "shirt", "t-shirt", "cotton"],
    variants: {
      sizes: ["S", "M", "L", "XL"],
      colors: ["White", "Charcoal", "Navy"]
    },
    stock: 50
  },
  {
    id: "m-4",
    name: "Tailored Velvet Party Blazer",
    price: 14999,
    description: "A striking slim-fit velvet blazer designed specifically for evening events and high-end partywear.",
    category: "Outerwear",
    department: "Men",
    image: "/products/mens_velvet_blazer_1774556149570.png",
    tags: ["formal", "Men", "partywear", "suit", "blazer", "evening"]
  },
  {
    id: "m-5",
    name: "Premium Black Graphic Tee",
    price: 3499,
    description: "A heavy-weight cotton t-shirt featuring a subtle, high-density minimalist graphic print.",
    category: "Tops",
    department: "Men",
    image: "/products/mens_graphic_tee_1774556163917.png",
    tags: ["t-shirt", "Men", "casual", "black", "graphic"]
  },
  {
    id: "m-6",
    name: "Vintage Washed Denim Jacket",
    price: 10999,
    description: "Rugged, durable denim treated with a specialized vintage wash for a perfectly broken-in look.",
    category: "Outerwear",
    department: "Men",
    image: "/products/mens_vintage_denim_jacket_1774557271290.png",
    tags: ["jacket", "Men", "denim", "vintage", "casual"]
  },
  {
    id: "m-7",
    name: "Relaxed Fit Flannel Overshirt",
    price: 5499,
    description: "Ultra-soft brushed flannel. Designed strictly for versatile casual layering.",
    category: "Tops",
    department: "Men",
    image: "/products/mens_flannel_overshirt_1774557288573.png",
    tags: ["shirt", "Men", "flannel", "casual", "warm", "plaid"]
  },
  {
    id: "m-8",
    name: "Oversized Streetwear Hoodie",
    price: 6499,
    description: "A thick, fleece-lined hooded sweatshirt built for ultimate streetwear comfort.",
    category: "Outerwear",
    department: "Men",
    image: "/products/mens_streetwear_hoodie_1774556180237.png",
    tags: ["hoodie", "Men", "casual", "streetwear", "winter"]
  },
  {
    id: "m-9",
    name: "Formal White Dress Shirt",
    price: 6999,
    description: "Crisp, breathable, and perfectly tailored. The definitive white dress shirt for formal occasions.",
    category: "Tops",
    department: "Men",
    image: "/products/mens_white_dress_shirt_1774557305368.png",
    tags: ["shirt", "Men", "formal", "office", "white"]
  },

  // =====================
  // WOMENSWEAR DEPARTMENT
  // =====================
  {
    id: "w-1",
    name: "Silk Evening Party Gown",
    price: 22499,
    description: "Turn heads with this stunning silk gown. Designed to naturally drape for a flawless silhouette.",
    category: "Dresses",
    department: "Women",
    image: "/products/womens_silk_gown_1774556230602.png",
    tags: ["New Arrival", "Women", "dress", "partywear", "formal", "evening"]
  },
  {
    id: "w-2",
    name: "Floral Summer Girlish Top",
    price: 4999,
    description: "A breezy, beautifully patterned floral crop top perfect for casual summer days.",
    category: "Tops",
    department: "Women",
    image: "/products/womens_floral_top_1774556248971.png",
    tags: ["top", "Women", "girlish", "floral", "summer", "casual"]
  },
  {
    id: "w-3",
    name: "Classic Denim Crop Jacket",
    price: 8999,
    description: "Authentic cotton-denim jacket with structural crop styling. Perfect for a casual layering system.",
    category: "Outerwear",
    department: "Women",
    image: "/products/womens_denim_crop_1774557320546.png",
    tags: ["jacket", "Women", "denim", "casual"]
  },
  {
    id: "w-6",
    name: "Sleek Leather Moto Jacket",
    price: 15999,
    description: "An edgy, beautifully tailored asymmetrical leather jacket for night-out partywear.",
    category: "Outerwear",
    department: "Women",
    image: "/products/womens_leather_jacket_1774556266008.png",
    tags: ["jacket", "Women", "leather", "partywear", "edgy"]
  },

  // =====================
  // KIDS DEPARTMENT
  // =====================
  {
    id: "k-1",
    name: "Little Gentleman Tailored Suit",
    price: 8999,
    description: "A complete, adorable 3-piece formal suit featuring suspenders and a bowtie for partywear events.",
    category: "Outerwear",
    department: "Kids",
    image: "/products/kids_formal_suit_1774556284928.png",
    tags: ["suit", "Kids", "partywear", "formal", "boys"]
  },
  {
    id: "k-2",
    name: "Princess Tulle Party Dress",
    price: 6499,
    description: "A magical, multi-layered tulle party dress designed to make her feel like royalty.",
    category: "Dresses",
    department: "Kids",
    image: "/products/kids_party_dress_1774556301558.png",
    tags: ["dress", "Kids", "partywear", "girls", "formal"]
  },
  {
    id: "k-4",
    name: "Heavy Winter Puffer Jacket",
    price: 5999,
    description: "Engineered for maximum thermal retention during extreme playground winters.",
    category: "Outerwear",
    department: "Kids",
    image: "/products/kids_puffer_jacket_1774556318480.png",
    tags: ["jacket", "Kids", "winter", "puffer", "casual"]
  },
  {
    id: "k-8",
    name: "Formal White Ring-Bearer Shirt",
    price: 2899,
    description: "A crisp, miniaturized formal white shirt perfect for weddings or high-end partywear.",
    category: "Tops",
    department: "Kids",
    image: "/products/kids_ring_bearer_1774556337632.png",
  },
  {
    id: "m-10",
    name: "Midnight Blue Trench Coat",
    price: 19999,
    description: "An incredibly tailored midnight blue trench coat designed for commanding winter weather in absolute sheer luxury.",
    category: "Outerwear",
    department: "Men",
    image: "/products/mens_midnight_trench.png",
    tags: ["New Arrival", "Men", "winter", "trench", "coat", "formal"]
  },
  {
    id: "m-11",
    name: "High-Performance Chinos",
    price: 6499,
    description: "Engineered khaki chinos with 4-way stretch and structural memory for a flawless tailored fit.",
    category: "Bottoms",
    department: "Men",
    image: "/products/mens_chinos.png",
    tags: ["pants", "Men", "chinos", "casual", "office"]
  },
  {
    id: "m-12",
    name: "Knitted Olive Polo Shirt",
    price: 5299,
    description: "A breathable luxury knitted polo in olive green. Perfect for high-end golf course aesthetics or casual fridays.",
    category: "Tops",
    department: "Men",
    image: "/products/mens_knit_polo.png",
    tags: ["shirt", "Men", "polo", "casual", "green"]
  },
  {
    id: "m-13",
    name: "Tan Suede Bomber Jacket",
    price: 24999,
    description: "A masterclass in modern outerwear. Hand-stitched velvet-soft tan suede with a razor-sharp cut.",
    category: "Outerwear",
    department: "Men",
    image: "/products/mens_suede_bomber.png",
    tags: ["jacket", "Men", "suede", "bomber", "casual", "premium"]
  },
  {
    id: "m-14",
    name: "Beige Linen Summer Trousers",
    price: 7999,
    description: "Ultra-lightweight breezy linen trousers cut for luxury summer vacations and coastal evenings.",
    category: "Bottoms",
    department: "Men",
    image: "/products/mens_linen_trousers.png",
    tags: ["pants", "Men", "linen", "summer", "casual"]
  },
  // --- NEW WOMEN
  {
    id: "w-7",
    name: "Cream Cashmere Turtleneck",
    price: 13499,
    description: "Experience the ultimate softness. A pure cream cashmere turtleneck for exquisite winter layering.",
    category: "Tops",
    department: "Women",
    image: "/products/womens_cashmere_turtleneck.png",
    tags: ["sweater", "Women", "cashmere", "winter", "luxury"]
  },
  {
    id: "w-8",
    name: "Black Wide-Leg Trousers",
    price: 8499,
    description: "A dramatic, high-waisted wide-leg trouser offering extreme comfort and structural power.",
    category: "Bottoms",
    department: "Women",
    image: "/products/womens_wide_trousers.png",
    tags: ["pants", "Women", "formal", "office"]
  },
  {
    id: "w-9",
    name: "Emerald Green Satin Cocktail Dress",
    price: 18999,
    description: "Steal the show. A flowing emerald green satin cocktail dress cut to catch every single light in the room.",
    category: "Dresses",
    department: "Women",
    image: "/products/womens_emerald_dress.png",
    tags: ["dress", "Women", "partywear", "evening", "cocktail"]
  },
  {
    id: "w-10",
    name: "Camel Belted Wool Coat",
    price: 26999,
    description: "An imposing, cinematic camel wool coat with a severe belt wrap. An absolute winter essential.",
    category: "Outerwear",
    department: "Women",
    image: "/products/womens_wool_coat.png",
    tags: ["coat", "Women", "winter", "outerwear", "formal"]
  },
  {
    id: "w-11",
    name: "White Ruffled Silk Blouse",
    price: 11499,
    description: "Ethereal, breathable ruffled silk. Designed to transform any outfit into a Parisian statement.",
    category: "Tops",
    department: "Women",
    image: "/products/womens_silk_blouse.png",
    tags: ["blouse", "Women", "silk", "formal", "office"]
  },
  // --- NEW KIDS
  {
    id: "k-9",
    name: "Blue Denim Play Overalls",
    price: 4999,
    description: "Tough, durable, adorable blue denim overalls built for serious playground exploration.",
    category: "Outerwear",
    department: "Kids",
    image: "/products/kids_denim_overalls.png",
    tags: ["casual", "Kids", "denim", "overalls"]
  },
  {
    id: "k-10",
    name: "Red Canvas Striped Tee",
    price: 1899,
    description: "A bright, breathable red and white striped cotton tee for everyday adventures.",
    category: "Tops",
    department: "Kids",
    image: "/products/kids_striped_tee.png",
    tags: ["t-shirt", "Kids", "casual", "cotton"]
  },
  {
    id: "k-11",
    name: "Yellow Sunshine Knitted Cardigan",
    price: 3499,
    description: "A bright yellow knitted cardigan to layer over dresses or tees when the weather dips.",
    category: "Outerwear",
    department: "Kids",
    image: "/products/kids_knitted_cardigan.png",
    tags: ["sweater", "Kids", "cardigan", "winter"]
  },
  {
    id: "k-12",
    name: "Formal Plaid Wool Trousers",
    price: 4299,
    description: "Sophisticated plaid wool trousers shrunk down for your little gentleman's next event.",
    category: "Bottoms",
    department: "Kids",
    image: "/products/kids_plaid_trousers.png",
    tags: ["pants", "Kids", "formal", "partywear", "wool"]
  },
  {
    id: "k-13",
    name: "Navy Polka Dot Summer Dress",
    price: 3899,
    description: "A classically charming navy blue dress covered in white polka dots, designed perfectly for summer.",
    category: "Dresses",
    department: "Kids",
    image: "/products/kids_polka_dress.png",
    tags: ["dress", "Kids", "summer", "casual", "polkadots"]
  }
];
