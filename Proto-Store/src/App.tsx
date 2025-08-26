import { useEffect, useState } from "react";
import axios from "axios";
import {
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  TextField,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

type Product = {
  id: number;
  name: string;
  price: string;
  description: string;
	stock: number;
};

type CartItem = Product & { quantity: number };

function App() {
  const [products, setProducts] = useState<Product[]>([]);
	const [cart, setCart] = useState<CartItem[]>([]);
	const [showOrderForm, setShowOrderForm] = useState(false);
	const [customerName, setCustomerName] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  // Завантажуємо продукти
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/products", {
          withCredentials: true,
        });
        setProducts(res.data.products || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchProducts();
  }, []);

  // Завантажуємо кошик з localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const saveCart = (updatedCart: CartItem[]) => {
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  // Додаємо товар до кошика
  const addToCart = (product: Product) => {
    const exist = cart.find((item) => item.id === product.id);
    if (exist) {
      const updatedCart = cart.map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
      saveCart(updatedCart);
    } else {
      saveCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  // Змінюємо кількість
  const updateQuantity = (id: number, quantity: number) => {
    if (quantity < 1) return; // мінімум 1
    const updatedCart = cart.map((item) =>
      item.id === id ? { ...item, quantity } : item
    );
    saveCart(updatedCart);
  };

  // Видаляємо товар з кошика
  const removeFromCart = (id: number) => {
    const updatedCart = cart.filter((item) => item.id !== id);
    saveCart(updatedCart);
  };

  // Рахуємо суму
  const total = cart.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0
	);
	
	const handlePayment = async () => {
    // --- Симуляція оплати ---
    const isPaid = window.confirm(
      `Симуляція оплати: підтвердьте оплату ${total.toFixed(2)} грн`
    );
    if (!isPaid) return alert("Оплата не пройшла");

    // --- Формуємо payload ---
    const orderData = {
      customerName,
      deliveryAddress,
      items: cart.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: parseFloat(item.price),
      })),
      total: total.toFixed(2),
    };

    try {
      const res = await axios.post(
        "http://localhost:5000/api/order",
        orderData,
        { withCredentials: true }
      );

      if (res.status === 201) {
        alert("Замовлення успішно оформлено!");
        setCart([]);
        localStorage.removeItem("cart");
        setShowOrderForm(false);
        setCustomerName("");
        setDeliveryAddress("");
      }
    } catch (err) {
      console.error(err);
      alert("Помилка при створенні замовлення");
    }
  };

  return (
    <div className="p-6">
      <Typography variant="h4" className="mb-4">
        Прото-Магаз
      </Typography>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Продукти */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="rounded-2xl shadow-md">
              <CardContent>
                <Typography variant="h6">{product.name}</Typography>
                <Typography variant="h6">{product.stock}</Typography>
                <Typography color="text.secondary">
                  {product.description}
                </Typography>
                <Typography>Ціна: {product.price} грн</Typography>
                <Button
                  variant="contained"
                  color="primary"
                  className="mt-2"
                  onClick={() => addToCart(product)}
                >
                  Додати в кошик
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Кошик */}
        <div className="w-full md:w-80 p-4 bg-gray-100 rounded-2xl shadow-lg">
          <Typography variant="h5" className="mb-4">
            Кошик ({cart.length})
          </Typography>

          {cart.length === 0 && <Typography>Кошик порожній</Typography>}

          {cart.map((item) => (
            <Card key={item.id} className="mb-2 p-2 rounded-lg">
              <Typography>{item.name}</Typography>
              <Typography>Ціна: {item.price} грн</Typography>
              <div className="flex items-center gap-2 mt-1">
                <TextField
                  type="number"
                  size="small"
                  value={item.quantity}
                  onChange={(e) =>
                    updateQuantity(item.id, parseInt(e.target.value))
                  }
                  inputProps={{ min: 1 }}
                />
                <IconButton
                  color="error"
                  onClick={() => removeFromCart(item.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </div>
            </Card>
          ))}

          {cart.length > 0 && (
            <>
              <Typography className="mt-4 font-bold">
                Разом: {total.toFixed(2)} грн
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                className="mt-2"
                onClick={() => setShowOrderForm(true)}
              >
                Скласти замовлення
              </Button>
            </>
          )}

          {showOrderForm && (
            <Card className="p-4 mt-4 bg-gray-200 rounded-lg">
              <Typography variant="h6">Форма замовлення</Typography>
              <TextField
                label="Ім'я клієнта"
                fullWidth
                margin="normal"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <TextField
                label="Адреса доставки"
                fullWidth
                margin="normal"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
              />

              <Button
                variant="contained"
                color="primary"
                className="mt-2"
                onClick={handlePayment}
              >
                Оплатити
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
