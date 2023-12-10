const { Router } = require('express')
const checkAuth = require('../helper/auth')
const mongoose = require('mongoose');
const Column = require('../models/column');
const Task = require('../models/task');
const router = Router()
const fs =  require("fs")
const removeFile = require("../helper/removeFile");

const mappedCards = (cards) => cards.map(card => ({
  ...card,
  id: card._id
}))

router.get('/', checkAuth, async (req, res) => {
  try {
    const cardsPipeline = [
      {
        $match: {
          $expr: { $eq: ['$columnId', '$$columnId'] }
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
    ]
    
    if(req.query.search) {
      cardsPipeline.push({
        $match: {
          $or: [
            { title: { $regex: req.query.search, $options: "i" } },
            { description: { $regex: req.query.search, $options: "i" } }
          ]
        }
      })
    }
    
    const columns = await Column.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
      {
        $sort: { order: 1 }
      },
      {
        $lookup: {
          from: 'tasks',
          let: { columnId: '$_id' },
          pipeline: cardsPipeline,
          as: 'cards',
        },
      },
    ])

    const copyColumns = columns.map(el => {
        const id = el._id.toString()
        delete el._id;
        return {
          ...el,
          id,
          cards: el?.cards?.length ? mappedCards(el.cards) : []
        }
    })

    res.status(200).json({
      data: copyColumns
    })
  } catch(err) {
    console.log(err)
    res.status(400).json({
      message: "something went wrong"
    })
  }
})

router.post('/', checkAuth, async (req, res) => {
  try {
    const {title, label, order} = req.body

    const doc = await new Column({
      order,
      title, label, cards: [], userId: req.userId
    })

    const id = doc._id.toString()

    await doc.save()

    res.status(201).json({
      ...doc._doc,
      id
    })
  } catch(e) {
    console.log(e)
    res.status(400).json({
      message: "somesing went wrong"
    })
  }
})

router.patch('/:id', checkAuth, async (req, res) => {
  try {
    const {title, label, order} = req.body

    const doc = await Column.findById(req.params.id)

    if(!doc) {
      res.status(404).json({
        message: 'sorry I can`t find the document'
      })
    }

    if(doc.order !== order && typeof order === 'number') {
      await Column.updateMany(
        {
          $and: [
            { order: doc.order < order  ? { $lte: order, $gt: doc.order } : { $gte: order, $lt: doc.order } },
            { userId: req.userId, }
          ]
        },
        {
          $inc: {
            order: order > doc.order ? -1 : +1
          }
        }
      );
      Object.assign(doc, {
        order,
      })
    }

    Object.assign(doc, {
      order: doc.order,
      title,
      label
    })

    await doc.save()

    res.status(201).json(doc._doc)

  } catch(e) {
    console.log(e)
    res.status(400).json({
      message: "Something went wrong"
    })
  }
})

router.delete('/:id', checkAuth, async (req, res) => {
  try {
    const doc = await Column.findOneAndDelete({
        _id: req.params.id
      })


    if(!doc) {
      return res.status(404).json({
        message: 'sorry I can`t delete a document'
      })
    }

    await Column.updateMany(
      {
        $and: [
          { order:  { $gt: doc.order }},
          { userId: req.userId, }
        ]
      },
      {
        $inc: {
          order: -1
        }
      }
    );

    const deletedTasks = await Task.find({
      $and: [
        { columnId: req.params.id },
        { background: { $exists: true } }
      ]
    })

    deletedTasks.forEach(({  background }) => {
        if(fs.existsSync(background)) removeFile(background)
    })


    await Task.deleteMany({
      columnId: req.params.id
    })

    res.status(200).json({
      message: `Column "${doc.title}" deleted successfully`
    })

  } catch(e) {
    console.log(e)
    res.status(400).json({
      message: "something went wrong"
    })
  }
})

module.exports = router
