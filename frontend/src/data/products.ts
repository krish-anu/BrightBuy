import type Product from '@/types/Product';

const products: Product[] = [
  {
    id: '1',
    name: 'Product 1',
    description: 'Description for Product 1',
    price: 100,
    imageUrl: 'https://img.drz.lazcdn.com/static/lk/p/4f0bee59ec7f89f6d66c2fcf53b4c2b8.jpg_720x720q80.jpg_.webp'
  },
  {
    id: '2',
    name: 'Product 2',
    description: 'Description for Product 2',
    price: 200,
    imageUrl: 'https://laz-img-sg.alicdn.com/p/78b8dec80157d337682922a21b93a564.jpg'
  },
  {
    id: '3',
    name: 'Product 3',
    description: 'Description for Product 3',
    price: 300,
    imageUrl: 'https://img.drz.lazcdn.com/static/lk/p/ff4f558f492df6becd00f42ae4a11a78.jpg_720x720q80.jpg_.webp'
  }
];

export default products;
