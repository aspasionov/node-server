const { Router } = require('express')
const checkAuth = require('../helper/auth')
const checkAdmin = require('../helper/checkIsAdmin')
const Column = require('../models/column');
const Task = require('../models/task');
const User = require('../models/user')
const { ObjectId } = require('mongodb');

const router = Router()

router.get('/columns', checkAuth, checkAdmin, async (req, res) => {
  try {
  const page = +req.query.page || 1
  const columnPerPage = +req.query.limit || 1000
  const search = { title: { $regex: req.query?.search || '', $options: 'i' } }
  const skip = (page - 1) * columnPerPage;
  const userIds = req.query.userIds ? req.query?.userIds.split(',').map(id => new ObjectId(id)) : []
  let matchStage = {};
  
  if(req.query.search && userIds.length > 0) {
    matchStage.$and = [search, { userId: { $in: userIds } }]
  } else if (req.query.search && !userIds.length) {
    matchStage = search
  } else if (!req.query.search && userIds.length > 0) {
    matchStage = { userId: { $in: userIds } }
  }
  
    const totalCount = await Column.countDocuments(matchStage)
    
    const columns = await  Column.find(matchStage)
      .skip(skip)
      .limit(columnPerPage);
    
    res.status(200).json({
      data: columns,
      meta: {
        total_count: totalCount
      }
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
    const fields = req.query?.fields ? req.query.fields.split(',') : []
    const objectFields = fields.length ? fields.reduce((pv,cv) => ({...pv, [cv]: 1}), {}) : {name: 1}
    const users = await User.find({}, objectFields)

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
