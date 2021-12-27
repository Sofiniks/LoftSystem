const User = require('./schemas/user');
const News = require('./schemas/news');

module.exports.getUserByName = async (userName) => {
    return User.findOne({ userName })
}

module.exports.getUserById = async (id) => {
    return User.findById({ _id: id })
}

module.exports.createUser = async (data) => {
    const { username, surName, firstName, middleName, password } = data
    const newUser = new User({
        userName: username,
        surName,
        firstName,
        middleName,
        image: '',
        permission: {
            chat: { C: true, R: true, U: true, D: true },
            news: { C: true, R: true, U: true, D: true },
            settings: { C: true, R: true, U: true, D: true },
        },
    })
    newUser.setPassword(password)
    const user = await newUser.save()
    console.log(user)
    return user
}

module.exports.getUsers = function () {
    return User.find({});
};

module.exports.updateUser = async function (data) {
    const { newPassword, oldPassword, id } = data;
    delete data.newPassword;
    delete data.id;

    const user = await User.findOneAndUpdate({ id }, data);
    if (newPassword && oldPassword && user.validPassword(oldPassword)) {
        user.setPassword(newPassword);
        await user.save();
    }

    return User.findOne({ id });
};

module.exports.getNews = async () => {
    return News.find({});
}

module.exports.addNews = async (news, user) => {
    const { text, title } = news
    const newsItem = new News({
        created_at: Date.now(),
        text,
        title,
        user: {
            firstName: user.firstName,
            id: user._id,
            image: user.image,
            middleName: user.middleName,
            surName: user.surName,
            userName: user.username
        }

    })
    return newsItem.save()
}

module.exports.deleteNews = (id) => {
    return News.findOneAndDelete({ _id: id });
};

module.exports.deleteUser = (id) => {
    return User.findOneAndDelete({ _id: id });
};

module.exports.getNewsById = function (id) {
    return News.findOne({ id });
};

module.exports.getNewsOwnerId = async function (id) {
    const newsItem = await News.findOne({ _id: id })
    console.log('News iten', newsItem)
    return newsItem.get('user').id;
};

module.exports.updateNews = function (news) {
    return News.findOneAndUpdate(
        { id: news._id },
        {
            text: news.text,
            title: news.title,
        }
    );
};

module.exports.updatePermissions = async function (userId, permission) {
    const user = await User.findOne({ userId });
    const { news, chat, setting } = user.get('permission');
    const permissions = {
        news: { ...news, ...permission.news },
        chat: { ...chat, ...permission.chat },
        settings: { ...setting, ...permission.settings },
    };
    await User.findOneAndUpdate({ userId }, { permission: permissions });
    return User.findOne({ userId });
};

