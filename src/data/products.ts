export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  type: 'COMIDAS' | 'BEBIDAS';
  description?: string;
  variations: Variation[];
  ratings: ProductRating[];
  averageRating: number;
}

export interface Variation {
  id: number;
  name: string;
  price: number;
  tags?: string[];
}

export interface ProductRating {
  id: number;
  userId: string;
  rating: number; // 1-5 estrellas
  comment?: string;
  date: string;
  userName: string;
}

export interface Waiter {
  id: number;
  name: string;
  photo?: string;
  ratings: WaiterRating[];
  averageRating: number;
}

export interface WaiterRating {
  id: number;
  userId: string;
  rating: number; // 1-5 estrellas
  comment?: string;
  date: string;
  userName: string;
  tableNumber: number;
}

export interface LoyaltyProgram {
  id: number;
  userId: string;
  points: number;
  level: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  benefits: string[];
  lastPurchase: string;
  totalSpent: number;
}

// Función auxiliar para inicializar un producto con las propiedades de valoración
const initializeProduct = (product: Omit<Product, 'ratings' | 'averageRating'>): Product => ({
  ...product,
  ratings: [],
  averageRating: 0
});

export const products: Product[] = [
  // Vinos Tintos
  initializeProduct({
    id: 1292,
    name: "Saint Felicient",
    price: 15000,
    image: "/images/pexels-photo-391213.webp",
    category: "VINOS TINTOS",
    type: "BEBIDAS",
    description: "Vino tinto de alta calidad",
    variations: []
  }),
  initializeProduct({
    id: 1293,
    name: "Nicassia",
    price: 14000,
    image: "/images/pexels-photo-391213.webp",
    category: "VINOS TINTOS",
    type: "BEBIDAS",
    description: "Vino tinto premium",
    variations: []
  }),
  initializeProduct({
    id: 1294,
    name: "Las Perdices",
    price: 10000,
    image: "/images/pexels-photo-391213.webp",
    category: "VINOS TINTOS",
    type: "BEBIDAS",
    description: "Vino tinto de bodega tradicional",
    variations: []
  }),
  initializeProduct({
    id: 1295,
    name: "Perro Callejero",
    price: 9000,
    image: "/images/pexels-photo-391213.webp",
    category: "VINOS TINTOS",
    type: "BEBIDAS",
    description: "Vino tinto joven y accesible",
    variations: []
  }),
  initializeProduct({
    id: 1296,
    name: "Cordero con Piel de Lobo",
    price: 6500,
    image: "/images/pexels-photo-391213.webp",
    category: "VINOS TINTOS",
    type: "BEBIDAS",
    description: "Vino tinto de autor",
    variations: []
  }),
  initializeProduct({
    id: 1626,
    name: "Dv catena malbec",
    price: 17000,
    image: "/images/pexels-photo-391213.webp",
    category: "VINOS TINTOS",
    type: "BEBIDAS",
    description: "Malbec premium de Catena Zapata",
    variations: []
  }),

  // Vinos Blancos
  initializeProduct({
    id: 1297,
    name: "Nicassia",
    price: 14000,
    image: "/images/white_wine-scaled.jpg",
    category: "VINOS BLANCOS",
    type: "BEBIDAS",
    description: "Vino blanco premium",
    variations: []
  }),
  initializeProduct({
    id: 1298,
    name: "Las Perdices",
    price: 10000,
    image: "/images/white_wine-scaled.jpg",
    category: "VINOS BLANCOS",
    type: "BEBIDAS",
    description: "Vino blanco de bodega tradicional",
    variations: []
  }),
  initializeProduct({
    id: 1625,
    name: "Santa Julia blanco",
    price: 7500,
    image: "/images/white_wine-scaled-1.jpg",
    category: "VINOS BLANCOS",
    type: "BEBIDAS",
    description: "Vino blanco orgánico",
    variations: []
  }),
  initializeProduct({
    id: 1637,
    name: "Las Perdices Torrontes",
    price: 10000,
    image: "/images/white_wine-scaled-1.jpg",
    category: "VINOS BLANCOS",
    type: "BEBIDAS",
    description: "Torrontés de alta calidad",
    variations: []
  }),

  // Champagne
  initializeProduct({
    id: 1299,
    name: "Chandon Extra Brut",
    price: 20000,
    image: "/images/white_champagne-scaled.jpg",
    category: "CHAMPAGNE",
    type: "BEBIDAS",
    description: "Champagne extra brut de alta calidad",
    variations: []
  }),
  initializeProduct({
    id: 1300,
    name: "Chandon Delice",
    price: 20000,
    image: "/images/white_champagne-scaled.jpg",
    category: "CHAMPAGNE",
    type: "BEBIDAS",
    description: "Champagne dulce y elegante",
    variations: []
  }),
  initializeProduct({
    id: 1301,
    name: "Salentein",
    price: 15000,
    image: "/images/white_champagne-scaled.jpg",
    category: "CHAMPAGNE",
    type: "BEBIDAS",
    description: "Champagne argentino premium",
    variations: []
  }),
  initializeProduct({
    id: 1624,
    name: "Barón b",
    price: 40000,
    image: "/images/white_champagne-scaled-1.jpg",
    category: "CHAMPAGNE",
    type: "BEBIDAS",
    description: "Champagne de alta gama",
    variations: []
  }),

  // Cervezas
  initializeProduct({
    id: 1302,
    name: "Pinina Heineken",
    price: 4000,
    image: "/images/beer_rubia.png",
    category: "CERVEZAS",
    type: "BEBIDAS",
    description: "Cerveza rubia premium",
    variations: []
  }),
  initializeProduct({
    id: 1303,
    name: "Pinina Sol",
    price: 4000,
    image: "/images/beer_rubia.png",
    category: "CERVEZAS",
    type: "BEBIDAS",
    description: "Cerveza rubia refrescante",
    variations: []
  }),
  initializeProduct({
    id: 1564,
    name: "Miller 330",
    price: 3500,
    image: "/images/beer_rubia.png",
    category: "CERVEZAS",
    type: "BEBIDAS",
    description: "Cerveza rubia en lata",
    variations: []
  }),
  initializeProduct({
    id: 1638,
    name: "Pinta sta fe",
    price: 2500,
    image: "/images/beer_rubia.png",
    category: "CERVEZAS",
    type: "BEBIDAS",
    description: "Cerveza artesanal local",
    variations: []
  }),
  initializeProduct({
    id: 1639,
    name: "Pinta heineken",
    price: 3500,
    image: "/images/beer_rubia.png",
    category: "CERVEZAS",
    type: "BEBIDAS",
    description: "Cerveza premium en pinta",
    variations: []
  }),
  initializeProduct({
    id: 1640,
    name: "Chopp heineken 500cc",
    price: 5000,
    image: "/images/beer_rubia.png",
    category: "CERVEZAS",
    type: "BEBIDAS",
    description: "Chopp de cerveza premium",
    variations: []
  }),

  // Sin Alcohol
  initializeProduct({
    id: 1305,
    name: "Agua Sin Gas",
    price: 2000,
    image: "/images/glass-of-water-4087606_1920.jpg",
    category: "SIN ALCOHOL",
    type: "BEBIDAS",
    description: "Agua mineral sin gas",
    variations: []
  }),
  initializeProduct({
    id: 1306,
    name: "Agua Con Gas",
    price: 2000,
    image: "/images/glass-of-water-4087606_1920.jpg",
    category: "SIN ALCOHOL",
    type: "BEBIDAS",
    description: "Agua mineral con gas",
    variations: []
  }),
  initializeProduct({
    id: 1307,
    name: "Sprite",
    price: 2500,
    image: "/images/pngimg.com-sprite_PNG98770.png",
    category: "SIN ALCOHOL",
    type: "BEBIDAS",
    description: "Gaseosa lima-limón",
    variations: []
  }),
  initializeProduct({
    id: 1308,
    name: "Coca Cola",
    price: 2500,
    image: "/images/pexels-photo-4113669.webp",
    category: "SIN ALCOHOL",
    type: "BEBIDAS",
    description: "Gaseosa cola clásica",
    variations: []
  }),
  initializeProduct({
    id: 1309,
    name: "Coca Cola Zero",
    price: 2500,
    image: "/images/pexels-photo-4113669.webp",
    category: "SIN ALCOHOL",
    type: "BEBIDAS",
    description: "Gaseosa cola sin azúcar",
    variations: []
  }),
  initializeProduct({
    id: 1310,
    name: "Agua Saborizada",
    price: 2000,
    image: "/images/awa-pom-5001-195f3b34e593ea7f5516727707180487-1024-1024.jpg",
    category: "SIN ALCOHOL",
    type: "BEBIDAS",
    description: "Agua con sabor a frutas",
    variations: []
  }),

  // Tragos
  initializeProduct({
    id: 1315,
    name: "Gin Beefeater",
    price: 8000,
    image: "/images/gin.jpg",
    category: "TRAGOS",
    type: "BEBIDAS",
    description: "Gin premium inglés",
    variations: []
  }),
  initializeProduct({
    id: 1316,
    name: "Gin Bombay",
    price: 9000,
    image: "/images/gin.jpg",
    category: "TRAGOS",
    type: "BEBIDAS",
    description: "Gin premium con notas cítricas",
    variations: []
  }),
  initializeProduct({
    id: 1317,
    name: "Vodka Absolut",
    price: 8000,
    image: "/images/vodka.jpg",
    category: "TRAGOS",
    type: "BEBIDAS",
    description: "Vodka premium sueco",
    variations: []
  }),
  initializeProduct({
    id: 1318,
    name: "Whisky Jack Daniels",
    price: 10000,
    image: "/images/whisky.jpg",
    category: "TRAGOS",
    type: "BEBIDAS",
    description: "Whisky americano premium",
    variations: []
  }),
  initializeProduct({
    id: 1319,
    name: "Ron Havana Club",
    price: 7000,
    image: "/images/ron.jpg",
    category: "TRAGOS",
    type: "BEBIDAS",
    description: "Ron cubano tradicional",
    variations: []
  }),
  initializeProduct({
    id: 1320,
    name: "Classic Mojito",
    price: 4000,
    image: "/images/cocteles_1-scaled.jpg",
    category: "TRAGOS",
    type: "BEBIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1321,
    name: "Negroni",
    price: 5500,
    image: "/images/cocteles_1-scaled.jpg",
    category: "TRAGOS",
    type: "BEBIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1322,
    name: "Daikiri",
    price: 4000,
    image: "/images/cocteles_1-scaled.jpg",
    category: "TRAGOS",
    type: "BEBIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1323,
    name: "Caipiroska",
    price: 5000,
    image: "/images/cocteles_1-scaled.jpg",
    category: "TRAGOS",
    type: "BEBIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1324,
    name: "Caipiriña",
    price: 5000,
    image: "/images/cocteles_1-scaled.jpg",
    category: "TRAGOS",
    type: "BEBIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1325,
    name: "Campari",
    price: 4500,
    image: "/images/cocteles_1-scaled.jpg",
    category: "TRAGOS",
    type: "BEBIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1326,
    name: "John Collins",
    price: 5000,
    image: "/images/cocteles_1-scaled.jpg",
    category: "TRAGOS",
    type: "BEBIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1327,
    name: "Cuba Libre",
    price: 6000,
    image: "/images/cocteles_1-scaled.jpg",
    category: "TRAGOS",
    type: "BEBIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1328,
    name: "Aperol",
    price: 4500,
    image: "/images/cocteles_1-scaled.jpg",
    category: "TRAGOS",
    type: "BEBIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1329,
    name: "Aperol Spritz",
    price: 7000,
    image: "/images/cocteles_1-scaled.jpg",
    category: "TRAGOS",
    type: "BEBIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1330,
    name: "Cynar",
    price: 4500,
    image: "/images/cocteles_1-scaled.jpg",
    category: "TRAGOS",
    type: "BEBIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1331,
    name: "Ginebra",
    price: 3500,
    image: "/images/cocteles_1-scaled.jpg",
    category: "TRAGOS",
    type: "BEBIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1332,
    name: "Vermouth Rosso",
    price: 4000,
    image: "/images/cocteles_1-scaled.jpg",
    category: "TRAGOS",
    type: "BEBIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1333,
    name: "Collins",
    price: 4500,
    image: "/images/cocteles_1-scaled.jpg",
    category: "TRAGOS",
    type: "BEBIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1560,
    name: "Cynar julep",
    price: 5000,
    image: "/images/cocteles_1-scaled.jpg",
    category: "TRAGOS",
    type: "BEBIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1641,
    name: "Jhonie walker double Black",
    price: 12000,
    image: "/images/cocteles_1-scaled-1.jpg",
    category: "TRAGOS",
    type: "BEBIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1642,
    name: "Chivas 12",
    price: 9000,
    image: "/images/cocteles_1-scaled-1.jpg",
    category: "TRAGOS",
    type: "BEBIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1643,
    name: "Medida fernet",
    price: 2500,
    image: "/images/cocteles_1-scaled-1.jpg",
    category: "TRAGOS",
    type: "BEBIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1772,
    name: "Gin Tanqueray",
    price: 7500,
    image: "/images/cocteles_1-scaled-1.jpg",
    category: "TRAGOS",
    type: "BEBIDAS",
    variations: []
  }),

  // Comidas
  initializeProduct({
    id: 1334,
    name: "Ciabatta de crudo",
    price: 5500,
    image: "/images/caprese.jpg",
    category: "FRIOS",
    type: "COMIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1335,
    name: "Ciabatta capresse",
    price: 4500,
    image: "/images/caprese.jpg",
    category: "FRIOS",
    type: "COMIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1339,
    name: "Duo de tacos",
    price: 6500,
    image: "/images/BULLANGA-5.jpg",
    category: "PICADAS",
    type: "COMIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1340,
    name: "Duo de quesadillas",
    price: 5500,
    image: "/images/BULLANGA-5.jpg",
    category: "PICADAS",
    type: "COMIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1341,
    name: "Bondiolita a la cerveza negra",
    price: 10000,
    image: "/images/sandwich-de-bondiola-braseada-a-la-42Y46YQZZNALLCCUDTRGGLIZ3Y.webp",
    category: "ENTRE PANES CALIENTES",
    type: "COMIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1342,
    name: "Focaccia de entraña",
    price: 12000,
    image: "/images/focaccia-de-cebolla-caramelizada-foto-principal.webp",
    category: "ENTRE PANES CALIENTES",
    type: "COMIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1343,
    name: "Lomito en pan negro",
    price: 12000,
    image: "/images/lomito.webp",
    category: "ENTRE PANES CALIENTES",
    type: "COMIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1344,
    name: "Sándwich a la oriental",
    price: 6000,
    image: "/images/sandwiches-vegetales.webp",
    category: "ENTRE PANES CALIENTES",
    type: "COMIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1345,
    name: "La del pueblo",
    price: 7000,
    image: "/images/hamburger.png",
    category: "BURGERS",
    type: "COMIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1346,
    name: "Casa de humo",
    price: 8700,
    image: "/images/hamburger.png",
    category: "BURGERS",
    type: "COMIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1347,
    name: "Texas picante",
    price: 8200,
    image: "/images/hamburger.png",
    category: "BURGERS",
    type: "COMIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1348,
    name: "Bunker",
    price: 8700,
    image: "/images/hamburger.png",
    category: "BURGERS",
    type: "COMIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1349,
    name: "Bunker XL",
    price: 9000,
    image: "/images/hamburger.png",
    category: "BURGERS",
    type: "COMIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1350,
    name: "Saltaditos de lomo",
    price: 7000,
    image: "/images/6d9342cfd301-lomo-saltado-t.webp",
    category: "AL WOK (sin tacc)",
    type: "COMIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1351,
    name: "A la oriental",
    price: 5500,
    image: "/images/saltat-de-verdures-amb-salsa-de-soja-i-mel-alemany.webp",
    category: "AL WOK (sin tacc)",
    type: "COMIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1352,
    name: "Pollito bunker",
    price: 7000,
    image: "/images/pollo_teriyaki.webp",
    category: "AL WOK (sin tacc)",
    type: "COMIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1354,
    name: "Con cheddar y crocante de panceta",
    price: 7000,
    image: "/images/fresh-potatoes-fri-with-souce-scaled.jpg",
    category: "PAPAS",
    type: "COMIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1355,
    name: "Al verdeo",
    price: 6500,
    image: "/images/fresh-potatoes-fri-with-souce-scaled.jpg",
    category: "PAPAS",
    type: "COMIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1356,
    name: "Papas Bravas",
    price: 7000,
    image: "/images/fresh-potatoes-fri-with-souce-scaled.jpg",
    category: "PAPAS",
    type: "COMIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1357,
    name: "Muzarella",
    price: 6000,
    image: "/images/4e475ddf-2c43-4d47-b69c-990a92e91029-26f258f7fdb6a2b9fb16276674103675-640-0.webp",
    category: "PIZZAS",
    type: "COMIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1358,
    name: "Fugazza",
    price: 6500,
    image: "/images/fugazza-argentina_web.jpg.webp",
    category: "PIZZAS",
    type: "COMIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1359,
    name: "Rucula y parmesano",
    price: 7000,
    image: "/images/1515520232039.webp",
    category: "PIZZAS",
    type: "COMIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1360,
    name: "Roquefort y peras",
    price: 7800,
    image: "/images/maxresdefault.webp",
    category: "PIZZAS",
    type: "COMIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1366,
    name: "Frutas flambeadas al rhum",
    price: 7500,
    image: "/images/cake-921943_1920.jpg",
    category: "DULCES",
    type: "COMIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1367,
    name: "Tiramisú",
    price: 5000,
    image: "/images/cake-921943_1920.jpg",
    category: "DULCES",
    type: "COMIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1368,
    name: "Peras al Malbec c/ helado",
    price: 6500,
    image: "/images/cake-921943_1920.jpg",
    category: "DULCES",
    type: "COMIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1369,
    name: "Chocotorta",
    price: 2500,
    image: "/images/cake-921943_1920.jpg",
    category: "DULCES",
    type: "COMIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1370,
    name: "Tiramisú",
    price: 2500,
    image: "/images/cake-921943_1920.jpg",
    category: "DULCES",
    type: "COMIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1371,
    name: "Cheescake de frutos rojos",
    price: 2500,
    image: "/images/cake-921943_1920.jpg",
    category: "DULCES",
    type: "COMIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1841,
    name: "Super Lomito en pan casero (Para 2)",
    price: 20000,
    image: "/images/lomito.webp",
    category: "ENTRE PANES CALIENTES",
    type: "COMIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1842,
    name: "Lomito en pan de miga",
    price: 18500,
    image: "/images/lomito.webp",
    category: "ENTRE PANES CALIENTES",
    type: "COMIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1844,
    name: "Lomito en pan torpedo",
    price: 14000,
    image: "/images/lomito.webp",
    category: "ENTRE PANES CALIENTES",
    type: "COMIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1845,
    name: "Picada Chopera",
    price: 8000,
    image: "/images/BULLANGA-5.jpg",
    category: "PICADAS",
    type: "COMIDAS",
    variations: []
  }),
  initializeProduct({
    id: 1846,
    name: "Rabas",
    price: 14000,
    image: "/images/rabas.webp",
    category: "PICADAS",
    type: "COMIDAS",
    variations: []
  }),

  // Limonadas
  initializeProduct({
    id: 2001,
    name: "Limonada Clásica",
    price: 3500,
    image: "/images/limonada.jpg",
    category: "LIMONADAS",
    type: "BEBIDAS",
    description: "Limonada natural con menta y jengibre",
    variations: []
  }),
  initializeProduct({
    id: 2002,
    name: "Limonada de Frutos Rojos",
    price: 4000,
    image: "/images/limonada.jpg",
    category: "LIMONADAS",
    type: "BEBIDAS",
    description: "Limonada con frambuesas, moras y arándanos",
    variations: []
  }),
  initializeProduct({
    id: 2003,
    name: "Limonada de Maracuyá",
    price: 4000,
    image: "/images/limonada.jpg",
    category: "LIMONADAS",
    type: "BEBIDAS",
    description: "Limonada con pulpa de maracuyá",
    variations: []
  }),
  initializeProduct({
    id: 2004,
    name: "Limonada de Jengibre",
    price: 4000,
    image: "/images/limonada.jpg",
    category: "LIMONADAS",
    type: "BEBIDAS",
    description: "Limonada con jengibre fresco y menta",
    variations: []
  })
]; 