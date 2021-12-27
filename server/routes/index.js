const express = require('express');
const router = express.Router()
const db = require('../models');
const helper = require('../helper/serialize');
const passport = require('passport');
const tokens = require('../auth/tokens');
const formidable = require('formidable');
const path = require('path');
const { existsSync, mkdirSync, renameSync, unlinkSync } = require('fs');

const auth = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user) => {
        console.log(err, user)
        if (!user || err) {
            return res.status(401).json({
                code: 401,
                message: 'Unauthorized'
            })
        }
        req.user = user
        next()
    })(req, res, next)
}

router.post('/registration', async (req, res) => {
    const { username } = req.body

    const user = await db.getUserByName(username);

    if (user) {
        return res.status(409).json({ message: 'Пользователь с таким ником уже существует' })
    }

    try {
        const newUser = await db.createUser(req.body);
        // const token = await tokens.createTokens(newUser);
        res.status(201).json({
            ...helper.serializeUser(newUser),
        })
    } catch (e) {
        console.log(e)
        res.status(500).json({ message: e.message })
    }
});

router.post('/login', async (req, res, next) => {
    passport.authenticate(
        'local',
        { session: false },
        async (err, user, info) => {
            if (err) {
                return next(err)
            }
            if (!user) {
                return res.status(400).json({ message: 'Неверный логин/пароль' })
            }
            if (user) {
                console.log(user);
                const token = await tokens.createTokens(user);
                console.log(token)
                res.json({
                    ...helper.serializeUser(user),
                    ...token
                })
            }
        }
    )(req, res, next)
})

router.post('/refresh-token', async (req, res) => {
    const refreshToken = req.headers['authorization']
    const data = await tokens.refreshTokens(refreshToken)
    res.json({ ...data })
})

router.get('/profile', auth, async (req, res) => {
    const user = req.user

    res.json({
        ...helper.serializeUser(user)
    })
})

router.patch('/profile', auth, async (req, res) => {
    const form = new formidable.IncomingForm();
    let photoDir = '';

    form.parse(req, async function (err, fields, files) {
        if (err) {
            if (existsSync(files.avatar.filepath)) {
                unlinkSync(files.avatar.filepath);
            }
            return res.status(500).json({ message: 'Ошибка при обработке' })
        }
        if (files.avatar) {
            console.log('Files', files);
            const upload = path.join(process.cwd(), 'upload');

            if (!existsSync(upload)) {
                mkdirSync(upload)
            }

            form.uploadDir = upload;
            const { originalFilename, filepath } = files.avatar;
            const fileName = path.join(upload, originalFilename);
            renameSync(filepath, fileName);
            const index = fileName.lastIndexOf('upload');
            photoDir = fileName.slice(index + 'upload/'.length);
        }
        const updatedData = photoDir ? { ...fields, image: photoDir } : { ...fields };
        try {
            const user = await db.updateUser(updatedData);
            res.json({
                ...helper.serializeUser(user)
            });
        } catch (err) {
            console.error(err);
            res.status(400).json({ error: err.message });
        }
    })

})

router.get('/users', auth, async (req, res) => {
    try {
        const users = await db.getUsers();
        res.json(helper.serializeUsers(users));
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.message })
    }
})

router.patch('/users/:id/permission', auth, async (req, res) => {
    try {
        const userId = req.params.id;
        const userWithNewPermissions = await db.updatePermissions(
            userId,
            req.body.permission
        );
        res.json({
            ...helper.serializeUser(userWithNewPermissions)
        })
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
})

router.delete('/users/:id', auth, async (req, res) => {
    try {
        const user = await db.deleteUser(req.params.id);
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
})

router.get('/news', auth, async (req, res) => {
    try {
        const news = await db.getNews();
        res.json(helper.serializeNewsList(news));
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.message })
    }
})

router.post('/news', auth, async (req, res) => {
    try {
        await db.addNews(req.body, req.user);
        const news = await db.getNews();
        // res.status(201).json({
        //     ...helper.serializeNews(newNews)
        // })
        res.status(200).json(helper.serializeNewsList(news))
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
})

router.delete('/news/:id', auth, async (req, res) => {
    try {
        await db.deleteNews(req.params.id);
        const news = await db.getNews();
        res.json(helper.serializeNewsList(news));
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
})

router.patch('/news/:id', auth, async (req, res) => {
    try {
        const newsOwnerId = await db.getNewsOwnerId(req.params.id);
        if (newsOwnerId !== req.user._id.toString()) {
            return res
                .status(403)
                .json({ error: 'У вас нет прав на редактирование этой новости!' });
        }

        await db.updateNews(req.body);
        const news = await db.getNews();
        res.json(helper.serializeNewsList(news));
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }

})



module.exports = router;