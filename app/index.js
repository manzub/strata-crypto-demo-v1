// root application server api
// handles all route requests to api

// after create transaction call wallet.updateBalance on the transaction.

const path = require('path')
const express = require("express")
const cors = require("cors");
const bodyParser = require("body-parser")
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync")
const adapter = new FileSync(path.dirname(__filename)+'/data.json');
const Blockchain = require("../src/blockchain");
const Wallet = require("../src/wallet");
const Transaction = require("../src/transaction");
const TransactionPool = require("../src/transaction-pool");
const Miner = require("../src/miner")


const { TOTAL_SUPPLY, INITIAL_VALUE_USD, GAS_FEE, SCRIPT_ACCOUNT } = require("../src/config");
let LAST_SUPPLY = 0;
let CURRENT_VALUE = Number(INITIAL_VALUE_USD);
const {utils, uuidV1, createNewHash} = require("../src/utils");
const whitelist = ["http://165.22.40.207","http://localhost:8000","http://127.0.0.1:8000","http://s.test"]
var corsOption = {
    origin: function(origin, callback) {
        // add !origin to allow rest tools.
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    }
}

const app = express();
app.use(bodyParser.json())
app.use(cors(corsOption))
const lowdb = low(adapter);
const blockchain = new Blockchain()
const wallet = new Wallet();
const transaction = new Transaction();
const transactionPool = new TransactionPool({wallet, transaction})
const miner = new Miner({ transactionPool, blockchain, wallet })
const PORT = 3001 || process.env.PORT
const ROOT_ADDR = `http://localhost:${PORT}`


let CURRENT_SUPPLY;
function initCoinValue() {
    utils.readFile("chaindata/__.dat",(err,data)=>{
        if(err) console.log(err);
        // init  vars
        const line = data.toString().split(/\r?\n/)
        let lineToWrite;
        if(line[0]!=''){
            let lastDate = new Date(line[0])
            let newDate = new Date()
            let diff_in_time = newDate.getTime() - lastDate.getTime()
            let diff_in_days = diff_in_time / (1000 * 3600 * 24)
            LAST_SUPPLY = line[1] != '' && Number(line[1]) > 0 ? Number(line[1]) : 1.09;
            CURRENT_VALUE = line[2] != '' && Number(line[2]) > 0 ? Number(line[2]) : INITIAL_VALUE_USD;
            if(diff_in_days >= 1) {
                lineToWrite = `${newDate}\n${CURRENT_SUPPLY-0.01}\n${CURRENT_VALUE}`;
                utils.writeFile("chaindata/__.dat", lineToWrite, (err)=>{if(err)console.log(err);})
            }
        }else{
            let newDate = new Date()
            lineToWrite = `${newDate}\n${CURRENT_SUPPLY}\n${CURRENT_VALUE}`;
            utils.writeFile("chaindata/__.dat", lineToWrite, (err)=>{if(err)console.log(err);})
        }
    }) 
    setTimeout(initCoinValue, 360000);
}
setTimeout(() => {
    CURRENT_SUPPLY = wallet.getCurrentSupply() > 1 ? wallet.getCurrentSupply() : Number(1.10);
    setTimeout(initCoinValue,50)
}, 100);
lowdb.defaults({ users:[], api:[], tokens:[] }).write()

// ROUTES

app.get("/", (req, res)=>{
    res.json({})
})

app.post("/new-api", (req, res)=>{
    const { token } = req.body;
    let isExists = lowdb.get('token').find({id:token}).value()
    let msg = {}
    if(isExists) {
        let new_api = '0x'+createNewHash(token).substring(0,15);
        msg = { status:1,data:new_api,alert:'New Api Created' }
        res.json(msg)
    }else{
        msg = { status:1,data:'Invalid Token' }
        res.json(msg)
    }
})

app.post("/api/new-api-token", (req, res)=>{
    const { id:transaction_id, sender } = req.body;
    let validTransactions = transactionPool.validTransactions();
    let newToken;
    console.log(validTransactions);
    validTransactions.every(tr => {
        if(tr.id === transaction_id && tr.status == 'completed' && sender == tr.sender) {
            let amount_in_usd = 2.00;
            let strata_eqv = ((1/CURRENT_VALUE)*amount_in_usd).toFixed(2)
            if(tr.recipient == SCRIPT_ACCOUNT && tr.account >= strata_eqv) {
                newToken = uuidV1()
                console.log(newToken);
                lowdb.get('tokens').push({id:newToken}).write()
            }
            return;
        }
    })
    res.json({status:1,data:newToken,alert:'New Token Created!.'})
})

app.get("/api/wallets", (req, res)=>{
    wallet.loadWallets();
    setTimeout(() => {
        const response = []
        wallet.wallets.forEach(wallet=>{
            response.push({
                address:wallet.id,
                balance:wallet.balance
            })
        })
        res.json(response)
    }, 100);
})

app.post("/api/wallet-info", (req, res)=>{
    const { id } = req.body
    let w = wallet.fetchWallet(id)
    const obj = {
        status:1,
        address: w.id,
        balance: w.balance
    }
    res.json(obj);
})

app.get("/api/value", (req, res)=>{
    let increase = CURRENT_SUPPLY - LAST_SUPPLY;
    let percent = increase / LAST_SUPPLY;
    let value = Number(CURRENT_VALUE + percent).toFixed(2)
    res.json({
        currency:'STRATA-LY',
        currentValue: `$${value}`,
        percentIncrease:`${Math.round(percent*100)}%`
    });
})

app.get("/api/blocks", (req, res)=>{
    res.json(blockchain.chain)
})

app.get("/api/transactions", (req, res)=>{
    res.json(transactionPool.transactionPool)
})

app.post('/api/new-wallet', (req, res)=>{
    let newWallet = wallet.createNewWallet();
    res.json({
        status:1,
        data:newWallet,
        alert:'New Wallet Created'
    });
})

app.post('/api/create-transaction', (req, res)=>{
    const { sender, recipient, type } = req.body
    let amount = Number(req.body.amount) + GAS_FEE;
    let msg = 'New Transaction Added To Pool'
    let t = transaction.createTransaction({
        sender:wallet.fetchWallet(sender),
        recipient:wallet.fetchWallet(recipient),
        amount: type == 'fast' ? Number(amount + 0.006) : amount
    })
    transactionPool.addTransaction(t)
    if(wallet.getCurrentSupply() > TOTAL_SUPPLY || type == 'fast' ) {
        blockchain.addBlock({transaction:t})
        transactionPool.updateTransaction(t)
        msg = 'New Transaction Added To Chain'
    }
    res.json(msg)
})

app.post('/api/mine-transactions', (req, res)=>{
    const {address} = req.body
    let msg = {}
    if(address) {
        const mineT = miner.mineTransaction(address)
        if(mineT) {
            const { sender, recipient, amount } = mineT
            wallet.updateBalance({transaction:{ sender, recipient, amount }})
            msg = {
                status:1,
                data:`New transaction added to chain`
            }
        }else{
            msg = {
                status:1,
                data:`All Transactions in the pool have been mined`
            }
        }
    }
    res.json(msg).status(200)
})


app.listen(PORT, ()=>console.log(`listening on http://localhost:3001`))