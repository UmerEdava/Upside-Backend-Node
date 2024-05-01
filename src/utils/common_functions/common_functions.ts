// check mongo id
export const isMongoId = (id: string): boolean => {
    const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
    return mongoIdRegex.test(id);
};