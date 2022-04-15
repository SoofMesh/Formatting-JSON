const util = require('util');
const fs = require('fs');
const { parse } = require('path');

const readDistances = () => {
    const fileToRead = 'distances/distance.json';
    const file  =  fs.readFileSync(fileToRead);
    return JSON.parse(file);
}

/* enable log */
const SHOW_DEBUG_LOG = true;
/* Show log  */
const log = (text) => SHOW_DEBUG_LOG && console.log('Log => ', text);
/* Function to inspect a variable */
const inspectVar = (t, v) => SHOW_DEBUG_LOG && console.log(`${t}:\n`, util.inspect(v, false, null, true));

const identifySameOrigins = (distances) => {
    /* Marking the same origin,same destination distances */
    distances.map((item, index) => {
        const copiedItem = item;
        if (index > 0) {
          copiedItem.elements[index - 1].sameOrigin = true;
        }
        return copiedItem;
      });
}

var traversRoutes = (maxRouteLength, distance, closest, routeObject, dosfec, deliveryRoutes) => {
  let match = false;  
  for(let item = 0; item < deliveryRoutes.length; item += 1){   
    if(( deliveryRoutes[item].totalLength + parseFloat(distance.value)) <= maxRouteLength)
    {
      deliveryRoutes[item].totalLength += distance.value
      deliveryRoutes[item].route.push(routeObject)   
      match = true
      break      
    }
  }        
  if(!match){
    routeObject.path = `${dosfec[closest].distance.text} from Store to ${routeObject.customer}.`
    deliveryRoutes.push({
    totalLength: dosfec[closest].distance.value,
    route: [routeObject]
    })
  }
  return match         
}

const cleanRouteObject = ({ distance, duration }) => {
    const newObj = {
      distance, duration,
    };
    return newObj;
  };
const calculateCharges = (routeLength) => {
    /* Distance in miles */
    const dist = parseFloat((routeLength / 1610).toFixed(2));
    
    let deliveryCharges = 7.0;
    
  
    deliveryCharges = parseFloat(
      (dist + 1).toFixed(2),
    );
    if (dist < 2.5) {
      deliveryCharges = 1.0;
    } else if (dist > 2.49 && dist < 5) {
      deliveryCharges = 2.0;
    } else if (dist > 4.99 && dist < 7) {
      deliveryCharges = 3.0;
    }else if(dist<10.01){
        deliveryCharges = 5;
    }else{
        deliveryCharges = 10
    }
    
    return deliveryCharges;
  };

const solution = () => {
    log('start of solution');
    const data =  readDistances();
    const {origin_addresses:originAddresses,
           destination_addresses:destinationAddresses,
           rows:distances,
           customers
        } = data;
    const solution = [];
    identifySameOrigins(distances);
     /* 5 miles */
    const maxRouteLength = 8046 + (8046 * 0.3); // meters
    /* Parent Object */
    const calculations = {
        /* Distances of store from each customer */
        dosfec: distances[0].elements,
        /* Number of destinations */
        nod: destinationAddresses.length,
        /* Number of origins */
        nOrigins: originAddresses.length,
        /* All customers ready to be assigned to rider(s), default: no of destinations */
        customersRemaining: destinationAddresses.length,
        /* Number of riders currently allocated */
        routeNumber: 1,
        /* Previous total distance */
        prevDistance: 0,
        /* index for the last allocated customer */
        lastAllocated: 0,
        /* Delivery routes calculated */
        deliveryRoutes: [],
        /* Current Route */
        currentRoute: [],
      };
      while (calculations.customersRemaining > 0) {
        if (calculations.prevDistance === 0) {
          /* Find the customer closest to the store */
          // Set the first customer to be the closest by default
          let closest = 0;
          for (let i = 0; i < calculations.nod; i += 1) {
            /* If there is only one customer remaining
            and the is not allocated a route */
            if (calculations.customersRemaining < 2 && !calculations.dosfec[i].allocated) {
              /* Set this customer to be closest to the store */
              closest = i;
            } else if (
              /* If the distance of the last selected closest customer
              is greater than or equal to the current customer */
              calculations.dosfec[closest].distance.value
             >= calculations.dosfec[i].distance.value
             /* And of the the current customer is not allocated a route */
             && calculations.dosfec[i].allocated !== true) {
              /* Set the current customer in the loop to be the closest */
              closest = i;
            }
          }
          log(closest);
          /* Set the route status for  customer that was found
          to be the closest to the store to be true i.e. A route
          was found found for this individual customer */
          calculations.dosfec[closest].allocated = true;
          /* Set the route number to this customer */
          calculations.dosfec[closest].routeNumber = calculations.routeNumber;
          /* Set the total distance of the current route to be distance of this route just created  */
          let distance = calculations.dosfec[closest].distance
          
          /* Create a route object and remove any extra fields */
          const routeObject = {};
          /* Set the customer to the route */
          routeObject.customer = customers[closest];
            /* Get the charges for the customer using calculate charges method */
          routeObject.deliveryCharges = calculateCharges(calculations.dosfec[closest].distance.value);
          routeObject.path = `${calculations.dosfec[closest].distance.value} meters from Store to ${customers[closest]}.`
          
          if(traversRoutes(maxRouteLength, distance, closest, routeObject, calculations.dosfec, calculations.deliveryRoutes))
            calculations.prevDistance += calculations.dosfec[closest].distance.value
          else 
            calculations.prevDistance = calculations.dosfec[closest].distance.value
          //calculations.currentRoute.push(routeObject);

          
          /* Decremtnt the customers remaining to be assigned a route */
          calculations.customersRemaining -= 1;
          
          calculations.lastAllocated = closest;
        } else if (calculations.prevDistance > 0) {
          /* If the current route has at least one customer in it */
          /*
            and there are customers remaining
         */
         /* MAKE THIS VALUE FALSE BEFORE SOLVING. THIS MAKES SURE THAT THE LOOP DOES NOT RUN INFINITELY */  
         //const skipForTest = false;

          if (calculations.customersRemaining) {
                // SOLUTION

                let anotherClosest = 0;
                let lastAllocated = distances[calculations.lastAllocated + 1].elements
                for (let i = 0; i < calculations.nod; i += 1) {
                  /* If there is only one customer remaining
                  and the is not allocated a route */
                  if (calculations.customersRemaining < 2 && !calculations.dosfec[i].allocated) {
                    /* Set this customer to be closest to the store */
                    anotherClosest = i;
                  } else if (
                    /* If the distance of the last selected closest customer
                    is greater than or equal to the current customer */
                    lastAllocated[anotherClosest].distance.value
                   >= lastAllocated[i].distance.value
                   /* And of the the current customer is not allocated a route */
                   && calculations.dosfec[i].allocated !== true && (!lastAllocated[anotherClosest].sameOrigin && !lastAllocated[i].sameOrigin)) {
                    /* Set the current customer in the loop to be the closest */
                    anotherClosest = i;
                  }
                  else{
                    if(lastAllocated[anotherClosest].sameOrigin) anotherClosest += 1
                    else if(lastAllocated[i].sameOrigin) continue                    
                  } 
                }  
                log(`Another Closest: ${anotherClosest}`);

                calculations.dosfec[anotherClosest].allocated = true;
          
                calculations.dosfec[anotherClosest].routeNumber = calculations.routeNumber;             
              
                const routeObject = {};
                
                routeObject.customer = customers[anotherClosest];
                  
                routeObject.deliveryCharges = calculateCharges(lastAllocated[anotherClosest].distance.value);
                routeObject.path = `${lastAllocated[anotherClosest].distance.text} meters from ${customers[calculations.lastAllocated]} to ${customers[anotherClosest]}.`
                let distance = lastAllocated[anotherClosest].distance
                if(traversRoutes(maxRouteLength, distance, anotherClosest, routeObject, calculations.dosfec, calculations.deliveryRoutes))
                  calculations.prevDistance += lastAllocated[anotherClosest].distance.value
                else                    
                  calculations.prevDistance = lastAllocated[anotherClosest].distance.value                
              
                calculations.customersRemaining -= 1;
                
                calculations.lastAllocated = anotherClosest;
            }
        }        
      }
      calculations.deliveryRoutes.forEach(element => {
        let length = 0
        element.route.forEach(element => {
          if(element.path.split(" ")[1] == "ft"){
            length += parseFloat(element.path.split(" ")[0]/ 5280)
          }            
          else
            length += parseFloat(element.path.split(" ")[0])
        });
        element.totalLength = `${length} miles from Store`     
    });
    inspectVar('solution',calculations.deliveryRoutes)
    log('end of solution');
    return calculations.deliveryRoutes
}

module.exports = {
    solution
}