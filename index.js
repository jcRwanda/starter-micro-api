const express = require('express');
const router = express.Router();
const admin = require('');
const serviceAccount = require('./adminKey.json'); // Path to your serviceAccountKey.json file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://kusoko-c7030-default-rtdb.firebaseio.com" // Use your Firestore database URL
});

const db = admin.firestore();

const AT_USERNAME = 'jeancloudenizeyimana1@gmail.com';
const AT_API_KEY = 'a285b35a86abb2fe90b372028d8620dd50f61f9b732337fc205c120105135130';


const collectionRef = db.collection('products');
const collectionOfProvinceRef = db.collection('provinces');
const collectionOfMarketRef = db.collection('markets');

let data = []; // Initialize an array to store Firestore data
let provinceIds = [];
let marketIds = [];
let provinces = [];
let markets = [];
let userCarts = [];
let productsCart = [];
let currentProducts = [];

// Fetch province IDs
collectionOfProvinceRef.get()
  .then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const provinceId = doc.id;
      const provinceName = doc.data().name;
      provinceIds.push(provinceId);
      provinces.push(provinceName);
    });
  })
  .catch((error) => {
    console.error('Error fetching province data:', error);
  });

// Fetch product data
collectionRef.get()
  .then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      data.push(doc.data());
    });
    // console.log(data); // Do something with the data
  })
  .catch((error) => {
    console.error('Error fetching data:', error);
  });

router.post('/', async (req, res) => {
  const { sessionId, serviceCode, phoneNumber, text } = req.body;
  let response = '';

  if (text === '') {
    response = `CON Welcome to Ku-Isoko.\n Select your province:\n`;
    for (let i = 0; i < provinces.length; i++) {
      response += `${i + 1}. ${provinces[i]}\n`;
    }
  } else {
    let ussdRoute = text.split("*");
    if (ussdRoute.length === 1) {
      const selectedProvinceIndex = parseInt(ussdRoute[0]) - 1;

      // Validate selected province index
      if (selectedProvinceIndex >= 0 && selectedProvinceIndex < provinces.length) {
        const selectedProvince = provinces[selectedProvinceIndex];
        const selectedProvinceId = provinceIds[selectedProvinceIndex];

        // Fetch markets based on the selected provinceId
        const marketsSnapshot = await collectionOfMarketRef
          .where('provinceId', '==', selectedProvinceId)
          .get();

        markets = marketsSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        }));


        response = `CON Available markets in ${selectedProvince}:\n`;
        for (let i = 0; i < markets.length; i++) {
          response += `${i + 1}. ${markets[i].name}\n`;
        }

        response += '0. Go back\n';
      } else {
        response = 'END Invalid selection1\n';
      }
    }
    else if (ussdRoute.length === 2) {
      const selectedMarketIndex = parseInt(ussdRoute[1]) - 1;

      // Validate selected market index
      if (selectedMarketIndex >= 0 && selectedMarketIndex < markets.length) {
        const selectedMarket = markets[selectedMarketIndex];

        // Fetch products based on the selected market
        const productsSnapshot = await collectionRef
          .where('marketId', '==', selectedMarket.id)
          .get();

          currentProducts = productsSnapshot.docs.map((doc) => doc.data());
          console.log('+++++++++++++++++++++' + selectedMarket.id);

       if (currentProducts.length > 0) {
      console.log('+++++++++++++++++++++' + selectedMarket.id);
      response = `CON Available products in ${selectedMarket.name}:\n`;
      for (let i = 0; i < currentProducts.length; i++) {
        response += `${i + 1}. ${currentProducts[i].productTitle} - $${currentProducts[i].price}\n`;
      }

          response += '0. Go back\n';
        } else {
          response = 'END No products found for the selected market\n';
        }
      }
    } else if (ussdRoute.length === 3) {
      // Process the user's cart selection
    const  selectedByUserProducts = ussdRoute[1].split(',').map(Number);

      // Ensure the user has a cart
      if (!userCarts[phoneNumber]) {
        userCarts[phoneNumber] = [];
      }

  // Handle when the user has selected only one product
  if (selectedByUserProducts.length === 1) {
    const index = selectedByUserProducts[0];
    console.log('____________________' + selectedByUserProducts);

    if (index > 0 && index <= currentProducts.length) {
      const selectedProductCart = currentProducts[index - 1];
      userCarts[phoneNumber].push(selectedProductCart);

//           // Display a confirmation message with the total number of items in the cart
//     response = `CON Added to your cart:\n`;
//     response += `${userCarts[phoneNumber].length}. ${selectedProductCart.productTitle} - $${selectedProductCart.price}\n`;
//     response += '0. Go back\n';
//   } else {
//     response = 'END Invalid selection Cart\n';
//   }
// } else {
//   // Add selected products to the user's cart
//   for (const index of selectedByUserProducts) {
//     if (index > 0 && index <= currentProducts.length) {
//       const selectedProductsCart = currentProducts[index - 1];
//       userCarts[phoneNumber].push(selectedProductsCart);
//     }
   }

  // Display the contents of the user's cart
  response = 'CON Your Cart:\n';
  let totalAmount = 0;
  for (let i = 0; i < userCarts[phoneNumber].length; i++) {
    const cartItem = userCarts[phoneNumber][i];
    response += `${i + 1}. ${cartItem.productTitle} - $${cartItem.price}\n`;
    totalAmount += cartItem.price;
  }

  response += `Total: $${totalAmount}\n`;
  response += '1. Remove from Cart\n';
  response += '2. Pay\n';
      }
    } else if (ussdRoute.length === 4 && ussdRoute[0] === '2' && ussdRoute[1] === '1') {
      // Remove item from the user's cart
      const indexToRemove = parseInt(ussdRoute[3]) - 1;

      if (userCarts[phoneNumber] && indexToRemove >= 0 && indexToRemove < userCarts[phoneNumber].length) {
        userCarts[phoneNumber].splice(indexToRemove, 1);
        response = 'CON Item removed from the cart\n';
      } else {
        response = 'END Invalid selection\n';
      }
    } else if (ussdRoute.length === 3 && ussdRoute[0] === '2' && ussdRoute[1] === '2') {
      // Handle payment logic here
      // You can clear the user's cart after successful payment
      response = 'END Payment successful. Thank you!\n system is in Dev Mode!';
      userCarts[phoneNumber] = [];
    }

  else {

    response = 'END system is in Dev Mode!\n';
  }


    }

  res.set('Content-Type', 'text/plain');
res.send(response);
});

module.exports = router;