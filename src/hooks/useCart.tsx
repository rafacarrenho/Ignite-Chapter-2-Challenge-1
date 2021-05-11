import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = window.localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // duplicate actual cart
      const updatedCart = [...cart];

      // GET Total stock
      const stock = await api
        .get(`stock/${productId}`)
        .then((res) => res.data.amount);

      // check have some equal product in cart
      const hasProductInCart = updatedCart.find(
        (item) => item.id === productId
      );

      if (hasProductInCart && hasProductInCart.amount >= stock) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (hasProductInCart) {
        const newCart = updatedCart.map((item) => {
          if (item.id === productId) {
            return { ...item, amount: item.amount + 1 };
          }
          return item;
        });
        updateLocalStorage(newCart);
        setCart(newCart);
      } else {
        const product = await api.get(`products/${productId}`).then((res) => {
          return { ...res.data, amount: 1 };
        });
        updateLocalStorage([...updatedCart, product]);
        setCart([...updatedCart, product]);
      }
    } catch {
      // TODO
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExistInCart = cart.find((item) => item.id === productId);
      if (!productExistInCart) {
        toast.error("Erro na remoção do produto");
      } else {
        const newCart = cart.filter((product) => product.id !== productId);
        updateLocalStorage(newCart);
        setCart(newCart);
      }
      // TODO
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // GET Total stock
      const stock = await api
        .get(`stock/${productId}`)
        .then((res) => res.data.amount);

      if (amount < 1) {
      } else if (amount > stock) {
        toast.error("Quantidade solicitada fora de estoque");
      } else {
        const newCart = cart.map((product) => {
          if (product.id !== productId) {
            return product;
          } else {
            return { ...product, amount: amount };
          }
        });
        updateLocalStorage(newCart);
        setCart(newCart);
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  const updateLocalStorage = (value: Product[]) => {
    window.localStorage.setItem("@RocketShoes:cart", JSON.stringify(value));
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
