
export type Category = {
    id: string;
    name: string;
    slug: string;
};

export type Product = {
    id: string;
    category_id: string;
    name: string;
    description?: string;
    price: number;
    image?: string;
    ingredients?: string[];
    badge?: string;
};

export const categories: Category[] = [
    { id: "cat_burgers", name: "Hamburguesas", slug: "hamburguesas" },
    { id: "cat_sandwiches", name: "Sandwiches", slug: "sandwiches" },
    { id: "cat_sides", name: "Patatas", slug: "patatas" },
    { id: "cat_starters", name: "Para Picar", slug: "para-picar" },
    { id: "cat_drinks", name: "Bebidas", slug: "bebidas" },
];

export const products: Product[] = [
    // Hamburguesas
    {
        id: "pozu",
        category_id: "cat_burgers",
        name: "Pozu",
        price: 12.00,
        ingredients: ['Pan americano', 'Huevo', 'Tomate', 'Bacon', 'Queso cheddar', 'Carne 100% ternera asturiana', 'Salsa especial Pozu', 'Lechuga'],
        image: "/images/burgers/pozu.png",
        badge: "Best Seller"
    },
    {
        id: "gourmet",
        category_id: "cat_burgers",
        name: "Gourmet",
        price: 12.00,
        ingredients: ['Cebolla caramelizada', 'Queso de cabra', 'Tomate', 'Bacon', 'Carne 100% ternera asturiana', 'Lechuga'],
        image: "/images/burgers/gourmet.png",
        badge: "Chef's Choice"
    },
    {
        id: "selecta",
        category_id: "cat_burgers",
        name: "Selecta",
        price: 12.00,
        ingredients: ['Cebolla a la plancha', 'Tomate', 'Salsa barbacoa ahumada', 'Bacon', 'Queso cheddar', 'Carne 100% ternera asturiana', 'Lechuga'],
        image: "/images/burgers/selecta.png"
    },
    {
        id: "oikos",
        category_id: "cat_burgers",
        name: "Oikos",
        price: 12.00,
        ingredients: ['Jalapeños', 'Cebolla Roja', 'Tomate', 'Queso Edam', 'Carne 100% ternera asturiana', 'Salsa de Yogur', 'Lechuga'],
        image: "/images/burgers/oikos.png",
        badge: "Vegetal Friendly"
    },
    {
        id: "cielito",
        category_id: "cat_burgers",
        name: "Cielito Lindo",
        price: 12.00,
        ingredients: ['Cebolla Roja', 'Jalapeños', 'Aguacate', 'Tomate', 'Bacon', 'Queso', 'Carne 100% Ternera Asturiana', 'Lechuga'],
        image: "/images/placeholder.png"
    },
    {
        id: "everest",
        category_id: "cat_burgers",
        name: "Everest",
        price: 12.00,
        ingredients: ['Pan americano', 'Pimientos Asados', 'Mermelada Bacon & Mayo Bacon', 'Bacon', 'Queso Cheddar', 'Cebolla Roja', 'Carne 100% Ternera Asturiana', 'Lechuga'],
        image: "/images/placeholder.png"
    },
    // Sandwiches
    {
        id: "sand_pozu",
        category_id: "cat_sandwiches",
        name: "Sandwich Pozu",
        price: 8.00,
        ingredients: ['Huevo', 'Lechuga', 'Tomate', 'Salsa americana de mostaza suave', 'Bacon', 'Jamón York', 'Queso'],
        image: "/images/placeholder.png"
    },
    {
        id: "sand_york",
        category_id: "cat_sandwiches",
        name: "Sandwich York y Queso",
        price: 3.50,
        ingredients: ['Jamón York', 'Queso'],
        image: "/images/placeholder.png"
    },
    // Patatas
    {
        id: "pat_pozu",
        category_id: "cat_sides",
        name: "Patatas Pozu",
        price: 9.00,
        description: "Patatas al horno con salsa ranchera, quesos, bacon crujiente y jalapeños",
        image: "/images/placeholder.png"
    },
    {
        id: "pat_4salsas",
        category_id: "cat_sides",
        name: "Cuatro Salsas",
        price: 8.50,
        description: "Miel y mostaza, Ketchup, Brava, Alioli",
        image: "/images/placeholder.png"
    },
    // Para Picar
    {
        id: "pic_nachos_pozu",
        category_id: "cat_starters",
        name: "Nachos Pozu",
        price: 12.00,
        description: "Con Carne y Queso Crema",
        image: "/images/placeholder.png"
    },
    {
        id: "pic_tequenos",
        category_id: "cat_starters",
        name: "Tequeños",
        price: 8.00,
        description: "6 unidades + Salsa",
        image: "/images/placeholder.png"
    }
];
