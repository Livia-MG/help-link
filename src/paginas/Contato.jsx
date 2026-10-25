import { useState } from "react";
import { Mail, Phone, MapPin, Send, Check } from "lucide-react";
import { Estrutura } from "../componentes/Estrutura";
import { toast } from "sonner";

const Contato = () => {
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.currentTarget;
    const payload = Object.fromEntries(new FormData(form));

    try {
      const response = await fetch("/api/contato", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.ok === false) {
        throw new Error(data.message || "Nao foi possivel enviar a mensagem.");
      }

      setSent(true);
      toast.success("Mensagem enviada!", {
        description: "Em breve entraremos em contato.",
      });
      form.reset();
      setTimeout(() => setSent(false), 4000);
    } catch (error) {
      toast.error("Erro ao enviar mensagem", {
        description: error.message || "Tente novamente mais tarde.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Estrutura>
      <section className="bg-gradient-soft border-b border-border">
        <div className="container py-14 text-center max-w-2xl">
          <h1 className="font-display text-4xl md:text-5xl font-bold">Fale com a gente</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Sugestoes, parcerias ou cadastro de nova ONG? Estamos por aqui.
          </p>
        </div>
      </section>

      <section className="container py-16 grid lg:grid-cols-3 gap-8 max-w-5xl">
        <div className="space-y-4 lg:col-span-1">
          {[
            { icon: Mail, title: "Email", value: "helplinkhl@gmail.com" },
            { icon: Phone, title: "Telefone", value: "(17) 3322-0000" },
            { icon: MapPin, title: "Localizacao", value: "Barretos, Sao Paulo" },
          ].map((c) => (
            <div key={c.title} className="bg-card rounded-2xl border border-border p-5 shadow-card flex gap-3 items-start">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
                <c.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{c.title}</div>
                <div className="font-medium">{c.value}</div>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={onSubmit} className="lg:col-span-2 bg-card rounded-2xl border border-border p-8 shadow-card space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium leading-none">
                Nome
              </label>
              <input
                id="name"
                name="name"
                required
                minLength={2}
                maxLength={100}
                placeholder="Seu nome completo"
                className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium leading-none">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                maxLength={200}
                placeholder="voce@email.com"
                className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="msg" className="text-sm font-medium leading-none">
              Mensagem
            </label>
            <textarea
              id="msg"
              name="message"
              required
              minLength={10}
              maxLength={3000}
              rows={6}
              placeholder="Como podemos ajudar?"
              className="flex w-full min-h-20 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>

          <div className="hidden" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input
              id="website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto h-12 px-7 text-base inline-flex items-center justify-center gap-2 rounded-lg font-semibold text-white bg-linear-to-r from-primary to-primary-glow hover:opacity-95 shadow-glow transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {sent ? (
              <><Check className="h-4 w-4" /> Enviado</>
            ) : isSubmitting ? (
              "Enviando..."
            ) : (
              <><Send className="h-4 w-4" /> Enviar mensagem</>
            )}
          </button>
        </form>
      </section>
    </Estrutura>
  );
};

export default Contato;
