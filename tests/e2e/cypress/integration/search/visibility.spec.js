describe('Search', () => {
    it('is visible', () => {
        cy.visit('/');

        cy.contains('Usar minha localização atual');
    });
});