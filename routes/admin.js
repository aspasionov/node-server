const { Router } = require('express')
const checkAuth = require('../helper/auth')
const checkAdmin = require('../helper/checkIsAdmin')
const mongoose = require('mongoose');
const Column = require('../models/column');
const Task = require('../models/task');
const User = require('../models/user')
const router = Router()

router.get('/columns', checkAuth, checkAdmin, async (req, res) => {
  try {
  const columns = await Column.aggregate([
    {
      $sort: { order: 1 }
    },
    {
      $lookup: {
        from: 'tasks',
        let: { columnId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$columnId', '$$columnId'] },
            },
          },
          {
            $sort: { order: 1 }
          },
          {
            $project: {
              title: 1,
              description: 1,
              label: 1,
              order: 1,
              columnId: 1,
              background: 1
            },
          }
        ],
        as: 'cards',
      },
    },
  ])

    res.status(200).json({
      data: columns
    })
  } catch(err) {
    console.log(err)
    res.status(400).json({
      message: "something went wrong"
    })
  }
})

router.get('/tasks', checkAuth, checkAdmin, async (req, res) => {
  try {
    const tasks = await Task.find({})

    res.status(200).json({
      data: tasks
    })
  } catch(err) {
    console.log(err)
    res.status(400).json({
      message: "something went wrong"
    })
  }
})

router.get('/users', checkAuth, checkAdmin, async (req, res) => {
  try {
    const users = await User.find({})

    res.status(200).json({
      data: users
    })
  } catch(err) {
    console.log(err)
    res.status(400).json({
      message: "something went wrong"
    })
  }
})

router.get('/statistic', checkAuth, checkAdmin, async (req, res) => {
  try {
    // const users = await User.find({})

    res.status(200).json({
      data: ['lol', 'kek']
    })
  } catch(err) {
    console.log(err)
    res.status(400).json({
      message: "something went wrong"
    })
  }
})

module.exports = router
