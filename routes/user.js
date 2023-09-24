const { Router } = require('express')
const checkAuth = require('../helper/auth')
const { userValidator }  = require('../validators')
const { validationResult } = require('express-validator')
const fileUploader  = require('../helper/fileUpload')
const removeFile = require('../helper/removeFile')
const User = require('../models/user')
const fs = require("fs")
const router = Router()

router.patch('/:id', checkAuth, userValidator,  async (req, res) => {
    try {
        const errors = validationResult(req);

        if(!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array().map(({ msg, path }) => ({ [path]: msg}))
            })
        }

        const { name, email, avatar } = req.body
        const userDoc = await User.findById(req.params.id)
        const existUser = await User.findOne({
            email,
            _id: { $ne: req.params.id  }
        })

        if(existUser) {
            return res.status(400).json({
                message: 'Email is already busy'
            })
        }

        if(!avatar) {
            try {
                if(fs.existsSync(userDoc.avatar)) removeFile(userDoc.avatar)
                userDoc.avatar = ''
            } catch(e) {
                console.log(e);
            }
        }

        Object.assign(userDoc, {
            name,
            email
        })

        userDoc.save()

        res.status(200).json(userDoc._doc)
    } catch(e) {
        console.log(e)
        res.status(404).json({
            message: 'something went wrong'
        })
    }
} )

router.post('/avatar/:id', checkAuth, fileUploader.single('avatar'),  async (req, res) => {
    try {
        res.setHeader('Content-Type', 'image/png')
        const userDoc = await User.findById(req.params.id)
        userDoc.avatar = req.file.path
        userDoc.save()
        res.status(200).json(userDoc._doc)
    } catch(e) {
        console.log(e)
        res.status(404).json({
            message: 'something went wrong'
        })
    }
} )

module.exports = router