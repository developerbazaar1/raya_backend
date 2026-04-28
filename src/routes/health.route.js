const router = require('express').Router();

router.get('/', (req, res) => {
  res.status(200).json({ message: 'Server is healthy!' });
});

module.exports = router;