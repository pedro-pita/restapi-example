const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const fetch = require('node-fetch');

const handleErrorResponse = (res, error, defaultMessage) => {
  if (error.name === 'AbortError') {
    return res.status(408).json({ message: 'Request timed out' });
  }
  if (error.message.includes('404')) {
    return res.status(404).json({ error: 'Product not found' });
  }
  if (error.message.includes('401')) {
    return res.status(401).json({ error: 'Access not permited' });
  }
  console.error('Erro:', error);
  return res.status(500).json({ error: defaultMessage });
};

const handleFetchErrors = (response) => {
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  return response;
};

router.get('/', protect, async (req, res) => {
  try {
    const response = await fetch('https://dummyjson.com/products');
    clearTimeout(timeoutId);
    handleFetchErrors(response);
    const products = await response.json();
    const filteredProducts = products.products.map(product => ({
      id: product.id,
      title: product.title,
      description: product.description,
      category: product.category
    }));

    res.json(filteredProducts);
  } catch (error) {
    handleErrorResponse(res, error, 'Error requesting data');
  }
});

router.get('/:id', protect, async (req, res) => {
  const productId = req.params.id;
  try {
    const response = await fetch(`https://dummyjson.com/products/${productId}`, { signal });
    
    clearTimeout(timeoutId);
    handleFetchErrors(response);
    const product = await response.json();
    const filteredProduct = {
      id: product.id,
      title: product.title,
      description: product.description,
      category: product.category
    };

    res.json(filteredProduct);
  } catch (error) {
    handleErrorResponse(res, error, 'Error requesting data');
  }
});

module.exports = router;

