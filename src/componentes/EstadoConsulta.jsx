export function EstadoConsulta({ carregando, erro, tentarNovamente }) {
  if (erro) {
    return (
      <div role="alert" className="py-10 text-center text-muted-foreground">
        <p>Não foi possível carregar os dados. Tente novamente.</p>
        <button type="button" onClick={tentarNovamente} className="mt-4 rounded-md bg-primary px-5 py-2 text-primary-foreground">
          Tentar novamente
        </button>
      </div>
    );
  }
  if (carregando) {
    return <p role="status" className="py-10 text-center text-muted-foreground">Carregando instituições...</p>;
  }
  return null;
}
