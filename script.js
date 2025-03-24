function verificarParOuImpar() {
    let numero = document.getElementById('numero').value;
    let resultado = document.getElementById('resultado');

    if (numero === '') {
        resultado.textContent = 'Por favor, digite um número!';
        resultado.style.color = 'red';
        return;
    }

    numero = parseInt(numero);

    if (numero % 2 === 0) {
        resultado.textContent = `O número ${numero} é PAR.`;
        resultado.style.color = 'blue';
    } else {
        resultado.textContent = `O número ${numero} é ÍMPAR.`;
        resultado.style.color = 'green';
    }
}
