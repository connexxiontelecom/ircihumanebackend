const { describe, it } = require("@jest/globals")
const dotenv = require('dotenv');

dotenv.config();
let token = process.env.LOGIN_TOKEN
const request = require('supertest')
const app = require('../app');
describe('IrcIhumane Api', () => {
    it('GET /payment definitions --> array payment definitions', ()=> {
        return request(app)
            .get('/payment-definitions')
            .set('x-auth-token', token)
            // .expect('Content-Type', /json/)
            .expect(200)
            .then((response) => {
                expect(response.body).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            pd_id: expect.any(Number),
                            pd_payment_code: expect.any(String),
                            pd_payment_name: expect.any(String),
                            pd_payment_type: expect.any(Number),
                            pd_payment_variant: expect.any(Number),
                            pd_payment_taxable: expect.any(Number),
                            pd_desc: expect.any(String),
                            pd_basic: expect.any(String),
                            pd_tie_number: expect.any(String),
                            createdAt: expect.any(String),
                            updatedAt: expect.any(String)
                        })
                    ])
                )
            })

    })

    it('POST /payment definitions/add-payment-definitions --> array payment definitions', ()=> {
        return request(app)
            .post('/payment-definitions/add-payment-definition')
            .set({
                'x-auth-token': token,
              })
            .send({
                pd_payment_code: "780",
                pd_payment_name: "test payment",
                pd_payment_type: 1,
                pd_payment_variant: 1,
                pd_payment_taxable: 1,
                pd_desc: 1,
                pd_basic: "1",
                pd_tie_number: "test",
            })
            // .expect('Content-Type', /json/)
          //.expect(200)
            .then((response) => {
                expect(response.body).toEqual(
                    expect.objectContaining({
                        pd_id: expect.any(Number),
                        pd_payment_name: "test payment",
                        pd_payment_type: 1,
                        pd_payment_variant: 1,
                        pd_payment_taxable: 1,
                        pd_desc: 1,
                        pd_basic: "1",
                        pd_tie_number: "test",
                        createdAt: expect.any(String),
                        updatedAt: expect.any(String)
                    })
                )
            })

    })

    it('PATCH /payment definitions/update-payment-definitions --> array payment definitions', ()=> {
        return request(app)
            .patch('/payment-definitions/update-payment-definition/1')
            .set({
                'x-auth-token': token,
            })
            .send({
                pd_payment_code: "791",
                pd_payment_name: "Basic Salary",
                pd_payment_type: 1,
                pd_payment_variant: 0,
                pd_payment_taxable: 1,
                pd_desc: 0,
                pd_basic: "1",
                pd_tie_number: "null",
            })
            // .expect('Content-Type', /json/)
            .expect(200)
            .then((response) => {
                expect(response.body).toEqual(
                    `Payment Definition Updated`
                )
            })

    })
})
