module.exports.serializeUser = (user) => {
    return {
        firstName: user.firstName,
        id: user._id,
        image: user.image,
        middleName: user.middleName,
        permission: user.permission,
        surName: user.surName,
        username: user.userName
    }
}

module.exports.serializeUsers = (users) => {
    const usersArr = users.map((user) => {
        return {
            firstName: user.firstName,
            id: user._id,
            image: user.image,
            middleName: user.middleName,
            permission: user.permission,
            surName: user.surName,
            username: user.userName,
        }
    })
    return usersArr
}

module.exports.serializeNews = (news) => {
    const { text, title, created_at, user } = news
    return {
        created_at,
        text,
        title,
        id: news._id,
        user: {
            firstName: user.firstName,
            id: user.id,
            image: user.image,
            middleName: user.middleName,
            surName: user.surName,
            userName: user.username
        }
    }
}

module.exports.serializeNewsList = (newsList) => {
    const newsArr = newsList.map((news) => {
        return {
            created_at: news.created_at,
            text: news.text,
            title: news.title,
            id: news._id,
            user: {
                firstName: news.user.firstName,
                id: news.user.id,
                image: news.user.image,
                middleName: news.user.middleName,
                surName: news.user.surName,
                userName: news.user.username
            }
        }
    })
    return newsArr
}