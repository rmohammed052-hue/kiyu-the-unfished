import Header from '../Header';

export default function HeaderExample() {
  return (
    <Header 
      cartItemsCount={3}
      onMenuClick={() => console.log('Menu clicked')}
      onCartClick={() => console.log('Cart clicked')}
      onSearch={(query) => console.log('Search:', query)}
    />
  );
}
