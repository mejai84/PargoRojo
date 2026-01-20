
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
    { id: "cat_pescados", name: "Pescados", slug: "pescados" },
    { id: "cat_asados", name: "Asados", slug: "asados" },
    { id: "cat_cazuelas", name: "Cazuelas", slug: "cazuelas" },
    { id: "cat_arroz", name: "Arroces", slug: "arroces" },
    { id: "cat_bebidas", name: "Bebidas", slug: "bebidas" },
];

export const products: Product[] = [
    // Pescados
    {
        id: "pargo_rojo",
        category_id: "cat_pescados",
        name: "Pargo Rojo Frito",
        price: 45000,
        ingredients: ['Pargo Rojo fresco de 500g', 'Patacón', 'Arroz con coco', 'Ensalada fresca', 'Limón'],
        image: "/images/placeholder.png",
        badge: "Especialidad"
    },
    {
        id: "mojarra",
        category_id: "cat_pescados",
        name: "Mojarra Frita",
        price: 28000,
        ingredients: ['Mojarra roja', 'Patacón', 'Arroz', 'Ensalada'],
        image: "/images/placeholder.png"
    },
    // Cazuelas
    {
        id: "cazuela_mariscos",
        category_id: "cat_cazuelas",
        name: "Cazuela de Mariscos",
        price: 42000,
        ingredients: ['Calamar', 'Camarón', 'Almejas', 'Pulpo', 'Crema de leche', 'Gratinada con queso'],
        image: "/images/placeholder.png",
        badge: "Best Seller"
    },
    {
        id: "cazuela_camaron",
        category_id: "cat_cazuelas",
        name: "Cazuela de Camarón",
        price: 38000,
        ingredients: ['Camarón tigre', 'Crema de la casa', 'Queso parmesano', 'Tostadas de ajo'],
        image: "/images/placeholder.png"
    },
    // Asados
    {
        id: "churrasco",
        category_id: "cat_asados",
        name: "Churrasco",
        price: 35000,
        ingredients: ['Corte de res 300g', 'Papas al vapor', 'Yuca', 'Chimichurri', 'Ensalada'],
        image: "/images/placeholder.png"
    },
    {
        id: "costilla",
        category_id: "cat_asados",
        name: "Costilla de Cerdo BBQ",
        price: 32000,
        ingredients: ['Costillas ahumadas', 'Salsa BBQ casera', 'Papas a la francesa', 'Ensalada'],
        image: "/images/placeholder.png",
        badge: "Recomendado"
    },
    // Arroces
    {
        id: "arroz_marinera",
        category_id: "cat_arroz",
        name: "Arroz a la Marinera",
        price: 38000,
        ingredients: ['Mix de mariscos', 'Arroz amarillo', 'Vegetales', 'Chips de plátano'],
        image: "/images/placeholder.png"
    },
    {
        id: "arroz_camaron",
        category_id: "cat_arroz",
        name: "Arroz con Camarón",
        price: 35000,
        ingredients: ['Camarones salteados', 'Arroz', 'Pimentón', 'Cebolla', 'Plátano maduro'],
        image: "/images/placeholder.png"
    }
];
