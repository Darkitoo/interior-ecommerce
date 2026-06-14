import { db } from '../lib/db';
import { categories, products } from './schema';

async function seed() {
  console.log('🌱 Seeding database...');

  // Inserisci categorie
  const [arredamento, illuminazione, decorazioni] = await db
    .insert(categories)
    .values([
      { name: 'Arredamento', slug: 'arredamento', description: 'Mobili di design per la casa' },
      { name: 'Illuminazione', slug: 'illuminazione', description: 'Lampade e luci di design' },
      { name: 'Decorazioni', slug: 'decorazioni', description: 'Complementi e decorazioni' },
    ])
    .returning();

  // Inserisci prodotti
  await db.insert(products).values([
    {
      sku: 'CHAIR-001',
      name: 'Poltrona Scandinava',
      description: 'Poltrona dal design minimalista, perfetta per soggiorni moderni. Struttura in legno di faggio e rivestimento in tessuto premium.',
      price: '349.00',
      cost: '180.00',
      stockQuantity: 15,
      categoryId: arredamento.id,
      imageUrl: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&q=80',
    },
    {
      sku: 'SOFA-001',
      name: 'Divano Modulare 3 Posti',
      description: 'Divano modulare componibile con seduta extra profonda. Tessuto sfoderabile e lavabile.',
      price: '1299.00',
      cost: '650.00',
      stockQuantity: 8,
      categoryId: arredamento.id,
      imageUrl: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=80',
    },
    {
      sku: 'TABLE-001',
      name: 'Tavolino da Caffè',
      description: 'Tavolino in legno massello con finitura naturale. Linee pulite e design senza tempo.',
      price: '249.00',
      cost: '120.00',
      stockQuantity: 20,
      categoryId: arredamento.id,
      imageUrl: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=800&q=80',
    },
    {
      sku: 'LAMP-001',
      name: 'Lampada da Terra Arco',
      description: 'Lampada da terra con braccio ad arco regolabile. Base in marmo e finitura ottone.',
      price: '459.00',
      cost: '230.00',
      stockQuantity: 12,
      categoryId: illuminazione.id,
      imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80',
    },
    {
      sku: 'LAMP-002',
      name: 'Lampada da Tavolo Minimal',
      description: 'Lampada da tavolo dal design essenziale. Perfetta per scrivanie e comodini.',
      price: '129.00',
      cost: '60.00',
      stockQuantity: 25,
      categoryId: illuminazione.id,
      imageUrl: 'https://images.unsplash.com/photo-1543198126-a4d9e88f2b29?w=800&q=80',
    },
    {
      sku: 'VASE-001',
      name: 'Vaso Ceramica Artigianale',
      description: 'Vaso in ceramica fatto a mano. Ogni pezzo è unico con finitura opaca.',
      price: '79.00',
      cost: '35.00',
      stockQuantity: 30,
      categoryId: decorazioni.id,
      imageUrl: 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=800&q=80',
    },
    {
      sku: 'MIRROR-001',
      name: 'Specchio Tondo Design',
      description: 'Specchio rotondo con cornice sottile in metallo. Aggiunge luce e profondità.',
      price: '189.00',
      cost: '90.00',
      stockQuantity: 18,
      categoryId: decorazioni.id,
      imageUrl: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=800&q=80',
    },
    {
      sku: 'RUG-001',
      name: 'Tappeto Geometrico',
      description: 'Tappeto con motivo geometrico moderno. Fibra resistente e facile da pulire.',
      price: '299.00',
      cost: '150.00',
      stockQuantity: 10,
      categoryId: decorazioni.id,
      imageUrl: 'https://images.unsplash.com/photo-1600166898405-da9535204843?w=800&q=80',
    },
  ]);

  console.log('✅ Seeding completato!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Errore seeding:', err);
  process.exit(1);
});
