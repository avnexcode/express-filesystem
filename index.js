const fs = require('fs');

const dataDirectory = './data';
const jsonDirectory = './data/json';
const jsonFilePath = './data/json/data.json';

const createDirectoryStructure = () => {
    if (!fs.existsSync(dataDirectory)) {
        fs.mkdirSync(dataDirectory);
    }
    if (!fs.existsSync(jsonDirectory)) {
        fs.mkdirSync(jsonDirectory);
    }
    if (!fs.existsSync(jsonFilePath)) {
        fs.writeFileSync(jsonFilePath, '[]', 'utf-8');
    }
};

const saveDataToFile = data => fs.writeFileSync(jsonFilePath, JSON.stringify(data), 'utf-8');

const loadDataFromFile = () => {
    createDirectoryStructure();
    return JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
};

const createUser = user => {
    let users = loadDataFromFile();
    users.push(user);
    saveDataToFile(users);
};

const deleteUser = userId => {
    const users = loadDataFromFile().filter((item) => item.user_id !== userId);
    saveDataToFile(users);
};

const getUserDetails = userId => loadDataFromFile().find(item => item.user_id === userId);

const checkForDuplicate = (key, value) => {
    const users = loadDataFromFile();
    const duplicateUser = users.find(item => item[key] === value);
    return duplicateUser;
};

const findUsers = searchKey => loadDataFromFile().filter(item => item.name.toLowerCase().includes(searchKey.toLowerCase()));

const updateUser = user => {
    const users = loadDataFromFile()

    const userIndex = users.findIndex(item => item.user_id === user.user_id)

    const newUser = {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone
    }

    users[userIndex] = newUser
    saveDataToFile(users)
}

module.exports = {
    loadDataFromFile,
    createUser,
    deleteUser,
    getUserDetails,
    findUsers,
    checkForDuplicate,
    updateUser
};
