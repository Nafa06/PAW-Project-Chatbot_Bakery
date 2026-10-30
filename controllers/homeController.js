const ProdukModel = require('../models/produkModel');
const config = require('../config');

exports.index = (req, res) => {
  res.render('index', {
    judul: `${config.appName} - Dashboard Pesanan`,
    namaToko: config.appName,
    produk: ProdukModel.getAll(),
  });
};