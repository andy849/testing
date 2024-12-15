import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import random from 'randomstring'



// Test pet api functions of the store
// Each test creates and deletes it's own data.


/** positive api tests include:
  post /pet - DONE TestId: 1001
  get /pet{petId} - DONE TestId: 1001
  get /pet/findByStatus  - DONE TestId: 1002
  put /pet - DONE TestId: 1003
  delete /pet/{petId} - DONE TestId: 1005.
  post /pet/{petId}/uploadImage - DONE TestId: 1006
  post /pet/{petId} - DONE TestId: 1004
**/

/** negative api tests include:
  post /pet - DONE TestId: 2001
  get /pet{petId} - DONE TestId: 2002
**/

test.use({
    baseURL: 'https://petstore.swagger.io/v2/',
    extraHTTPHeaders: {
        //normally an api key would go in a env file. 
        //for purpose of demo we will leave here
        //in this scenario it is a random str and does not need to be secret.
        'api_key' : 'a1b2c33d4e5f6g7h8i9jakblc'
     }
  });


  type Pet = {
    id: string;
    category: {
      id: string;
      name: string;
    };
    name: string;
    photoUrls: string[];
    tags: {
      id: number;
      name: string;
    }[];
    status: "available" | "pending" | "sold"; 
  };

//instead of hardcoding petData for every test, lets create a function that will do it for us
//pet ID's will be random, therefore each pet will be unique
function getNewPetData() : Pet {
    const randomTestId = random.generate({length:7, charset: 'numeric'})
    const data = {
        "id": `${randomTestId}`,
        "category": {
        "id": '0',
        "name": "string"
        },
        "name": "doggie",
        "photoUrls": [
        "string"
        ],
        "tags": [
        {
            "id": 0,
            "name": "string"
        }
        ],
        "status": "available"
    } as Pet
    return data
}


// post /pet
// get /pet{petId}
test('TestId: 1001. Adds new pet to the store. Gets the pet by id to check if created successfully, then deletes pet', async ({ request }) => {

    const data = getNewPetData()
    const createPet = await request.post(`pet`, {
        data
      });
    expect(createPet.ok()).toBeTruthy();

    const responseJson = await createPet.json()
    const petId = await responseJson?.id;
  
    const getPet = await request.get(`pet/${petId}`);

    expect(getPet.ok()).toBeTruthy();

    const getPetJson = (await getPet.json())
    const getPetId = getPetJson?.id
    
    expect(petId).toEqual(getPetId);

    const deletePet = await request.delete(`pet/${petId}`);

    expect(deletePet.ok()).toBeTruthy();
  });

   //get /pet/findByStatus 
  test('TestId: 1002. gets all pets by status, confirms status is available', async ({ request }) => {
    const response = await request.get('pet/findByStatus?status=available')
    expect(response.ok()).toBeTruthy();
    expect(await response.json()).toContainEqual(expect.objectContaining({
      status: 'available',
    }));
    
  });


  // put /pet
  test('TestId: 1003. creates a pet, updates the name, gets pet to confirm the update, then delete pet', async ({ request }) => {
    
    const data = getNewPetData()
    const createPet = await request.post(`pet`, {
        data
      });
    expect(createPet.ok()).toBeTruthy();

    const responseJson = await createPet.json()
    const petId = await responseJson?.id;
    const putPet = await request.put(`pet`, {
        data: {
            "id": `${petId}`,
            "category": {
              "id": 0,
              "name": "string"
            },
            "name": "doggieRenamed",
            "photoUrls": [
              "string"
            ],
            "tags": [
              {
                "id": 0,
                "name": "string"
              }
            ],
            "status": "available"
          }
      });

    expect(putPet.ok()).toBeTruthy();

    const getPet = await request.get(`pet/${petId}`); 

    expect(getPet.ok()).toBeTruthy();

    const getPetJson = (await getPet.json())
    const getPetId = getPetJson?.id
    const getPetName = getPetJson?.name
    
    expect(petId).toEqual(getPetId);
    expect("doggieRenamed").toEqual(getPetName)

    const deletePet = await request.delete(`pet/${petId}`);

    expect(deletePet.ok()).toBeTruthy();
  });


  // post /pet/{petId} 
  test('TestId: 1004. creates a pet, updates fields name and status using petID via form data, gets pet to confirm the update, then deletes pet', async ({ request }) => {
    const data = getNewPetData()
    const createPet = await request.post(`pet`, {
        data
      });
    expect(createPet.ok()).toBeTruthy();

    const responseJson = await createPet.json()
    const petId = await responseJson?.id;

    const form = {
        petId: `${petId}`,
        name: 'doggieRenamed2',
        status: 'sold'
      };

    const postPet = await request.post(`pet/${petId}`, {
        form
      });
    expect(postPet.ok()).toBeTruthy();
    
    const getPet = await request.get(`pet/${petId}`); 
    expect(getPet.ok()).toBeTruthy();

    const getPetJson = (await getPet.json())
    const getPetId = getPetJson?.id
    const getPetName = getPetJson?.name
    
    expect(petId).toEqual(getPetId);
    expect("doggieRenamed2").toEqual(getPetName)

    const deletePet = await request.delete(`pet/${petId}`);

    expect(deletePet.ok()).toBeTruthy();
  });

  //delete /pet/{petId}
  test('TestId: 1005. creates a pet and deletes it by ID', async ({ request }) => {
    const data = getNewPetData()
    const createPet = await request.post(`pet`, {
        data
      });
    expect(createPet.ok()).toBeTruthy();

    const responseJson = await createPet.json()
    const petId = await responseJson?.id;
    const deletePet = await request.delete(`pet/${petId}`);

    expect(deletePet.ok()).toBeTruthy();
  });


  //post /pet/{petId}/uploadImage
  test('TestId: 1006. creates a Pet, uploads image, delete Pet', async ({ request }) => {
    const data = getNewPetData()
    const createPet = await request.post(`pet`, {
        data
      });
    expect(createPet.ok()).toBeTruthy();

    const responseJson = await createPet.json()
    const petId = await responseJson?.id;

    const filePath = path.resolve('tests/data/dog.jpeg');
    const fileBuffer = fs.readFileSync(filePath);
  
    const multipart = {
      file: {
        name: 'dog.jpeg',
        mimeType: 'image/jpeg',
        buffer: fileBuffer,
      },
      petId: `${petId}`,
    };

    const imagePet = await request.post(`pet/${petId}/uploadImage`, {
        multipart
      });

    expect(imagePet.ok()).toBeTruthy();

    const deletePet = await request.delete(`pet/${petId}`);

    expect(deletePet.ok()).toBeTruthy();
  });



// Test below here are negative cases

// post /pet
test('TestId: 2001. attempt to create a new pet with an invalid ID, check reponse rejects request.', async ({ request }) => {

  const createPet = await request.post(`pet`, {
      data : {
        "id": '#',
        "category": {
        "id": '0',
        "name": "string"
        },
        "name": "doggie",
        "photoUrls": [
        "string"
        ],
        "tags": [
        {
            "id": 0,
            "name": "string"
        }
        ],
        "status": "sold"
      }
    });
    expect(createPet.ok()).toBeFalsy();
});


// get /pet{petId}
test('TestId: 2002. Search for a pet that does not exist, return 404', async ({ request }) => {

  const randomTestId = random.generate({length:7, charset: 'numeric'})
  const getPet = await request.get(`pet/${randomTestId}`);
  expect(getPet.status()).toEqual(404)

});