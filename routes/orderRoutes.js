const express = require('express');
const router = express.Router();
const { Order } = require('../models/Order');
const { protect, admin, authorize } = require('../middleware/auth');
const fetch = require('node-fetch');

const validateProducts = async (products) => {
  const validProducts = [];

  for (const product of products) {
    const response = await fetch(`https://dummyjson.com/products/${product.id}`);
    if (response.ok) {
      const productData = await response.json();
      
      if (typeof productData.id === 'number' && 
          typeof productData.title === 'string' && 
          typeof productData.description === 'string' && 
          typeof productData.category === 'string'
      ) { 
        validProducts.push({
          id: productData.id,
          title: productData.title,
          description: productData.description,
          category: productData.category,
        });
      } else {
        console.error('Something went wrong!');
      }
    }
  }

  return validProducts;
};

router.post('/add', protect, async (req, res) => {
  const { products } = req.body;

  if (!products || products.length === 0) {
    return res.status(400).json({ message: 'No products selected for order.' });
  }

  try {
    const validProducts = await validateProducts(products);

    if (validProducts.length !== products.length) {
      return res.status(400).json({ message: 'One or more products are invalid.' });
    }

    const order = await Order.create({
      user: req.user._id,
      products: validProducts.map(product => ({
        id: product.id,
        title: product.title,
        description: product.description,
        category: product.category
      })),
      createdAt: new Date()
    });

    return res.status(201).json(order);
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong!" });
  }
});

router.get('/', protect, admin, authorize('list_all_orders'), async (_req, res) => {
  try {
    const orders = await Order.find();
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: 'Something went wrong!' });
  }
});

router.get('/details/:id', protect, authorize('list_all_orders'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (order.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to see this order.' });
    }

    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: 'Something went wrong!' });
  }
});

router.get('/myorders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id });
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: 'Something went wrong!' });
  }
});

module.exports = router;