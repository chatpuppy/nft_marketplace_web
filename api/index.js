const ethers = require('ethers')
const nft_core_abi = require('./_abi.json')

const NFT_core_contract_address = "0xAb50F84DC1c8Ef1464b6F29153E06280b38fA754"
const provider = new ethers.providers.AlchemyProvider("kovan", process.env.API_KEY);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider)
const NFTCoreConnectedContract = new ethers.Contract(NFT_core_contract_address, nft_core_abi, wallet);


export default async function handler(req, res) {

    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    // another common pattern
    // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )

    const id = req.query.id;
    let metadata;
    let _artifacts
    try {
        metadata = await NFTCoreConnectedContract.tokenMetaData(parseInt(id));
        _artifacts = parseInt(metadata["_artifacts"]["_hex"], 16)
    } catch(err) {
        console.log(err)
    }
    
    if(_artifacts===0) {
        res.json({
            "minted": "false",
            "unboxed": "false"
        })
    } else if(_artifacts===1) {
        res.json({
            "minted":"true",
            "unboxed": "false"
        })
    } else {
        res.json({
            "minted": "true",
            "unboxed": "true", 
        });
    }
    
};