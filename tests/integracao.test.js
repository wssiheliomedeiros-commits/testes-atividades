process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/database');

describe('API de Alunos', () => {

  beforeAll((done) => {
    const aguardarTabela = () => {
      db.get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='alunos'",
        (err, row) => {
          if (row) return done();
          setTimeout(aguardarTabela, 20);
        }
      );
    };
    aguardarTabela();
  });

  beforeEach((done) => {
    db.run('DELETE FROM alunos', done);
  });

  afterAll((done) => {
    db.close(done);
  });

  it('deve criar um aluno com sucesso (201) e persistir no banco', async () => {
    const resposta = await request(app)
      .post('/alunos')
      .send({ nome: 'Ana', matricula: '2026001' });

    expect(resposta.status).toBe(201);
    expect(resposta.body).toHaveProperty('id');

    db.get('SELECT * FROM alunos WHERE id = ?', [resposta.body.id], (err, row) => {
      expect(err).toBeNull();
      expect(row.nome).toBe('Ana');
      expect(row.matricula).toBe('2026001');
    });
  });

  it('deve retornar 400 quando faltar a matrícula', async () => {
    const resposta = await request(app)
      .post('/alunos')
      .send({ nome: 'Carlos' });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toBe('Dados incompletos');
  });

  it('deve retornar 409 ao tentar cadastrar matrícula duplicada', async () => {
    await request(app)
      .post('/alunos')
      .send({ nome: 'Maria', matricula: '2026123' });

    const resposta = await request(app)
      .post('/alunos')
      .send({ nome: 'João', matricula: '2026123' });

    expect(resposta.status).toBe(409);
    expect(resposta.body.erro).toBe('Matrícula já existe');
  });

});