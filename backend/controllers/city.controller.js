const ApiError = require('../utils/ApiError');

const db = require('../models');
const City = db.city;

const addCity = async (req, res, next) => {
    try {
        if (!req.body.name) throw new ApiError('Name is required', 400);
        const newCity = await City.create(req.body);
        res.status(201).json({ success: true, data: newCity });
    } catch (error) {
        next(error);
    }
};

const addToMainCity = async (req, res, next) => {
    try {
        const city = await City.findByPk(req.params.id);
        if (!city) throw new ApiError('City not found', 404);
        await city.update({ isMainCity: true });
        res.status(200).json({ success: true, data: city });
    } catch (error) {
        next(error);
    }
};

const isMainCity = async (req, res, next) => {
    try {
        const city = await City.findByPk(req.params.id, { attributes: ['isMainCity'] });
        if (!city) throw new ApiError("City not found", 404);
        res.status(200).json({ success: true, data: city });
    } catch (error) {
        next(error);
    }
};

const getCities = async (req, res, next) => {
    try {
        const cities = await City.findAll({ attributes: [{ exclude: ['createdAt', 'updatedAt'] }] });
        res.status(200).json({ success: true, data: cities });
    } catch (error) {
        next(error);
    }
};

const getCity = async (req, res, next) => {
    try {
        const city = await City.findByPk(req.params.id, { attributes: [{ exclude: ['createdAt', 'updatedAt'] }] });
        if (!city) throw new ApiError("City not found", 404);
        res.status(200).json({ success: true, data: city });
    } catch (error) {
        next(error);
    }
};

const getMainCities = async (req, res, next) => {
    try {
        const mainCities = await City.findAll({ where: { isMainCity: true }, attributes: [{ exclude: ['createdAt', 'updatedAt'] }] });
        if (!mainCities || !mainCities.length) throw new ApiError('Main cities not found', 404);
        res.status(200).json({ success: true, data: mainCities });
    } catch (error) {
        next(error);
    }
};

const getOtherCities = async (req, res, next) => {
    try {
        const otherCities = await City.findAll({ where: { isMainCity: true }, attributes: [{ exclude: ['createdAt', 'updatedAt'] }] });
        if (!otherCities || !otherCities.length) throw new ApiError('Other cities not found', 404);
        res.status(200).json({ success: true, data: otherCities });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCities,
    getCity,
    addCity,
    addToMainCity,
    getMainCities,
    getOtherCities,
    isMainCity,
}