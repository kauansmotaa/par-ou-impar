function verificarParOuImpar() {
    let numero = document.getElementById('numero').value;
    let resultado = document.getElementById('resultado');
    
    if (numero === "") {
        resultado.textContent = "Por favor, insira um número válido!";
        return;
    }
    
    numero = parseInt(numero);
    
    if (isNaN(numero)) {
        resultado.textContent = "Isso não é um número válido!";
    } else if (numero % 2 === 0) {
        resultado.textContent = `O número ${numero} é Par!`;
    } else {
        resultado.textContent = `O número ${numero} é Ímpar!`;
    }
}
