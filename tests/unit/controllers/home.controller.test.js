import { describe, it, expect, vi } from 'vitest';
const ProdukModel = require('../../../models/produkModel');
const homeController = require('../../../controllers/homeController');
const { mockDatabaseData } = require('../../fixtures/bakeryData');

describe('homeController', () => {
  it('merender view index dengan data toko dan produk', () => {
    vi.spyOn(ProdukModel, 'getAll').mockReturnValue(mockDatabaseData);
    const res = { render: vi.fn() };

    homeController.index({}, res);

    expect(res.render).toHaveBeenCalledWith(
      'index',
      expect.objectContaining({
        produk: mockDatabaseData
      })
    );
  });
});