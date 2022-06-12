describe('Search', () => {
    it('is visible', () => {
        cy.visit('/');

        cy.contains('Aproxime em uma área do mapa');
        cy.contains('para ver detalhes dos pontos de coleta.');
    });
});