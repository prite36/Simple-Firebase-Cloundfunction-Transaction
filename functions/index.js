const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp(functions.config().firebase)

exports.getBalance = functions.https.onRequest((req, res) => {
  admin.database().ref('/balance').once('value').then(snapshot => {
    res.send(`${snapshot.val()}`)
  })
})

exports.withdraw = functions.https.onRequest((req, res) => {
  let withdrawAmount = req.query.amount
  admin.database().ref('/balance').once('value').then(snapshot => {
    let oldBalance = snapshot.val()
    let newBalance = oldBalance - withdrawAmount
    admin.database().ref('/balance').set(newBalance).then(snapshot => {
      console.log({
        oldBalance,
        withdrawAmount,
        newBalance
      })
      res.send('success')
    })
  })
})


exports.addStock = functions.https.onRequest((req, res) => {
  let ProductId = req.query.ProductId
  let actions = req.query.Actions
  let amount = req.query.Amount
  let oldBalance = 0

    admin.database().ref('/products').child(ProductId).child('inStock').transaction(data => {
      if (data) {
        oldBalance = data
        if (actions === 'Add') {
          return +data + +amount
        } else if (actions === 'Deduct') {
          if (oldBalance > amount) {
            return +data - +amount
          } else {
            return
          }
        } else if (actions === 'Update') {
           return data  = amount
        }
      }
      return data
    }, (error, committed, snapshot) => {
      if (error) {
        res.status(500).send('Transaction failed abnormally!', error)
      } else if (!committed) {
        res.send(`Can not Deduct , inStock = ${oldBalance}`)
      } else {
        let newBalance = snapshot.val()
        console.log({
          oldBalance,
          amount,
          newBalance
        })
        res.send(`oldBalance = ${oldBalance} amount = ${amount} newBalance = ${newBalance}`)
      }
    })
})
