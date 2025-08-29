const generateSKU = (productName, variantName) => {
    const cleanProduct = productName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
    const cleanVariant = variantName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
    const random = Math.random().toString(36).substring(2, 4).toUpperCase();

    return `${ cleanProduct }${ cleanVariant }${ random }`;
};

module.exports = generateSKU;
