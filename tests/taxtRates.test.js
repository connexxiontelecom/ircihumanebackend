const { describe, it, xit } = require("@jest/globals")
const dotenv = require('dotenv');
dotenv.config();
let token = process.env.LOGIN_TOKEN
const request = require('supertest')
const app = require('../app');
describe('IrcIhumane Api', () => {
    xit('GET /tax rates --> array tax rates', ()=> {
        return request(app)
            .get('/tax-rates')
            .set('x-auth-token', token)
            // .expect('Content-Type', /json/)
            .expect(200)
            .then((response) => {
                expect(response.body).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            tr_id: expect.any(Number),
                            tr_band: expect.any(String),
                            tr_rate: expect.any(String),
                            createdAt: expect.any(String),
                            updatedAt: expect.any(String)
                        })
                    ])
                )
            })

    })


    xit('POST /tax-rates/add-tax-rate --> array tax rate', ()=> {
        return request(app)
            .post('/tax-rates/add-tax-rate')
            .set({
                'x-auth-token': token,
            })
            .send({
                tr_band: 500000,
                tr_rate: 13.5,
            })
            // .expect('Content-Type', /json/)
            .expect(200)
            .then((response) => {
                expect(response.body).toEqual(
                    expect.objectContaining({
                        tr_id: expect.any(Number),
                        tr_band: 500000,
                        tr_rate: 13.5,
                        createdAt: expect.any(String),
                        updatedAt: expect.any(String)
                    })
                )
            })

    })
})
