const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ message: `Duplicate value for ${field}` });
  }

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const response = { message };
  if (err.errors) response.errors = err.errors;
  res.status(status).json(response);
};

module.exports = errorHandler;
