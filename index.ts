import * as express from "express";
var bodyParser = require('body-parser')

let rest_app: express.Application = express();
rest_app.set('port', (process.env.PORT || 3000));

// create application/json parser
// ignore the mime type as the input mime type is unspecified
rest_app.use(bodyParser.json({ type: '*/*' }))

class ResponseType {
    constructor(public concataddress: string, public type: string, public workflow: string) { }
}

rest_app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
   if (err) {
      res.status(400).send('{"error": "Could not decode request: JSON parsing failed"}');
      return;
   }
});

rest_app.use((req: express.Request, res: express.Response) => {
   let err: boolean = false;
   if (!req.body.hasOwnProperty('payload'))
      err = true;
   if(!(req.body['payload'] instanceof Array))
      err = true;
   
   if (err) {
      res.status(400).send('{"error": "Could not decode request: JSON parsing failed"}');
      return;
   }
   
   let summary: ResponseType[] = [];
   
   let items: any[] = req.body['payload'];
   
   for (let item of items) {
      if(!item.hasOwnProperty('address') ||
         !item.hasOwnProperty('type')    ||
         !item.hasOwnProperty('workflow')) {
         err = true;
         break;
      }
      
      if (item['type'] !== 'htv' || item['workflow'] !== 'completed')
         continue;
      
      let address: any = item['address'];
      
      if(!address.hasOwnProperty('buildingNumber') ||
         !address.hasOwnProperty('street')    ||
         !address.hasOwnProperty('suburb')    ||
         !address.hasOwnProperty('state')    ||
         !address.hasOwnProperty('postcode')) {
         err = true;
         break;
      }
      
      let unit: string = address.hasOwnProperty('unitNumber') ? `${address['unitNumber']} ` : "";
      let coords: string = address.hasOwnProperty('lat') && address.hasOwnProperty('lon') ?
         ` Latitude ${address['lat']} Longitude ${address['lon']}` : "";
      let formated_address: string = `${unit}${address['buildingNumber']} ${address['street']} ${address['state']} ${address['postcode']}${coords}`;
      let rt: ResponseType = new ResponseType(formated_address, item['type'], item['workflow']);
      summary.push(rt);
   }
   
   if (err) {
      res.status(400).send('{"error": "Could not decode request: JSON parsing failed"}');
      return;
   }
   res.setHeader('Content-Type', 'application/json');
   res.end(JSON.stringify({"response": summary}));
});

rest_app.listen(rest_app.get('port'), () => {
   console.log('Rest Server listening on port 3000!');
});