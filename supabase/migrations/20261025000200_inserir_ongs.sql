-- Dados originais de src/dados/ongs.jsx, preservando IDs, acentos e ordem.
begin;

insert into public.categorias (id, nome, ordem) values
('animais', 'Animais', 0),
('pessoas', 'Pessoas', 1),
('alimentos', 'Alimentos', 2),
('criancas', 'Crianças', 3),
('saude', 'Saúde', 4),
('idosos', 'Idosos', 5)
on conflict (id) do nothing;

insert into public.ongs (id, nome, descricao_curta, descricao, endereco, bairro, latitude, longitude, aceita_voluntarios, emite_certificado, telefone, imagem, necessidades, ordem) values
('aba-barretos', 'ABA — Amigos Barretenses dos Animais', 'ONG de proteção animal que resgata, trata e promove adoção responsável em Barretos.', 'Organização não governamental dedicada ao resgate, tratamento e adoção responsável de animais abandonados na região de Barretos. Realiza castração, vacinação e feiras de adoção, promovendo uma cidade mais humana para os animais.', 'Via Cap. Eulálio Dornelles, 3500 — Barretos/SP', 'Barretos', -20.557, -48.567, true, false, '(17) 99781-2175', 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=900&q=80', ARRAY['Ração', 'Remédios veterinários', 'Voluntários para cuidados', 'Doação financeira']::text[], 0),
('apae-barretos', 'APAE Barretos', 'Atendimento educacional e terapêutico para pessoas com deficiência intelectual.', 'Oferece atendimentos especializados e gratuitos para mais de 300 pessoas com deficiências físicas, intelectuais ou síndromes em Barretos. Trabalha com educação especial, reabilitação, terapias e integração social.', 'Av. Dr. Roberto Rios, 999 — Jockey Club, Barretos/SP', 'Jockey Club', -20.5425, -48.5694, true, false, '(17) 3321-7810', 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=900&q=80', ARRAY['Material escolar', 'Equipamentos terapêuticos', 'Voluntários', 'Doação financeira']::text[], 1),
('vovo-antonio-barretos', 'Casa Acolhedora Vovô Antônio', 'Centro de acolhimento para idosos em situação de vulnerabilidade social.', 'Instituição de acolhimento que oferece moradia, alimentação, cuidados de saúde e atividades de integração social para idosos vulneráveis de Barretos. Promove dignidade e qualidade de vida na terceira idade.', 'Av. das Palmeiras, 3200 — Barretos/SP', 'Parque das Palmeiras', -20.5357, -48.5851, true, false, '(17) 3322-0035', 'https://images.unsplash.com/photo-1581579186913-45ac3e6efe93?w=900&q=80', ARRAY['Fraldas geriátricas', 'Medicamentos', 'Alimentos', 'Voluntários visitantes']::text[], 2),
('avcc-barretos', 'AVCC Barretos', 'Apoio emocional e material para pacientes em tratamento oncológico.', 'Associação Voluntária de Combate ao Câncer que apoia pacientes em tratamento no Hospital de Amor de Barretos. Oferece atendimento emocional, campanhas de arrecadação e auxílio com alimentação, transporte e higiene.', 'Av. Paulo de Mattos Leandro, 1357 — Dr. Paulo Prata, Barretos/SP', 'Dr. Paulo Prata', -20.5843, -48.5638, true, false, '(17) 3324-4519', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=900&q=80', ARRAY['Cestas básicas', 'Transporte para pacientes', 'Itens de higiene', 'Voluntários']::text[], 3),
('nosso-lar-barretos', 'Casa Assistencial Espírita Nosso Lar', 'Assistência social com distribuição de alimentos e apoio a famílias carentes.', 'Associação espírita que realiza assistência social em Barretos com distribuição de alimentos, roupas e apoio psicológico para famílias em situação de vulnerabilidade. Atua com voluntários há décadas na região.', 'Av. Dr. Sebastião Monteiro de Barros, 306 — Barretos/SP', 'Centro', -20.5578, -48.5707, true, false, '(17) 3324-1360', 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=900&q=80', ARRAY['Alimentos não perecíveis', 'Roupas', 'Produtos de higiene', 'Voluntários']::text[], 4),
('ama-barretos', 'AMA Barretos', 'Suporte educacional e terapêutico para pessoas com autismo e suas famílias.', 'Associação de Amigos do Autista dedicada ao suporte de pessoas com Transtorno do Espectro Autista (TEA) em Barretos. Oferece atendimento terapêutico, orientação familiar, atividades socioeducativas e defesa dos direitos das pessoas com autismo.', 'Rua Chile, 2015 — Barretos/SP', 'Centro', -20.5516, -48.5732, true, false, '(17) 3324-1888', 'https://images.unsplash.com/photo-1497375638960-ca368c7231e4?w=900&q=80', ARRAY['Material pedagógico', 'Equipamentos terapêuticos', 'Voluntários especializados', 'Doação financeira']::text[], 5),
('instituto-amor', 'Instituto O Amor - Unidade I', 'Instituição que apoia famílias em situação de vulnerabilidade.', 'Organização voltada ao atendimento de famílias em situação de vulnerabilidade social, atuando por meio da distribuição de doações, apoio comunitário contínuo e desenvolvimento de projetos de inclusão social. Seu trabalho busca fortalecer vínculos familiares, garantir acesso a recursos básicos e promover mais dignidade e qualidade de vida às pessoas atendidas', 'R. Antônio Francisco Serradela, N. 25 - Jardim Nova Barretos, Barretos/SP', 'Centro', -20.5349, -48.5566, true, false, '(17) 3312-2022', 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=900&q=80', ARRAY['Alimentos não perecíveis', 'Roupas', 'Produtos de higiene', 'Voluntários']::text[], 6),
('lar-das-criancas', 'Lar das Crianças - Legionárias de Ismael', 'Organização que acolhe crianças e adolescentes.', 'Instituição que atua no acolhimento e proteção de crianças e adolescentes em situação de risco social, oferecendo abrigo seguro, acompanhamento educacional e suporte emocional. Também promove atividades pedagógicas, recreativas e de desenvolvimento humano, buscando garantir direitos básicos e oportunidades de crescimento saudável.', 'R. Trinta e Quatro (Numeração Com Zero Inicial), 1332 - Centro, Barretos/SP', 'Centro', -20.5544, -48.566, true, false, '(17) 3322-1809', 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=900&q=80', ARRAY['Alimentos não perecíveis', 'Roupas', 'Produtos de higiene', 'Voluntários', 'Doação financeira', 'Material Escolar']::text[], 7),
('casa-transitoria', 'Casa Transitória André Luiz', 'Acolhimento de pessoas com deficiências múltiplas com assistência integral.', 'A Casa Transitória André Luiz destaca-se pelo acolhimento de pessoas com deficiências múltiplas, oferecendo cuidados contínuos em regime de internato. Conta com equipe dedicada para garantir bem-estar, saúde e qualidade de vida aos assistidos.', 'Av. 47, 0814 - Jardim das Flores, Barretos/SP', 'Centro', -20.5628, -48.587, true, false, '(17) 3322-8330', 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=900&q=80', ARRAY['Alimentos não perecíveis', 'Roupas', 'Fraldas geriátricas', 'Voluntários', 'Doação financeira', 'Material Escolar']::text[], 8),
('lions-club', 'Lions Club de Barretos', 'Apoio social e ações humanitárias.', 'Organização de caráter voluntário que promove campanhas solidárias e ações humanitárias na cidade, incluindo arrecadação e distribuição de alimentos, roupas e brinquedos, além de apoio a projetos sociais e de saúde comunitária. Atua por meio do trabalho de voluntários engajados em melhorar a qualidade de vida de pessoas em situação de vulnerabilidade.', 'Via Conselheiro Antonio Prado, 999 - Vila Pereira, Barretos/SP', 'Centro', -20.554, -48.5925, true, false, '(17) 98100-9488', 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=900&q=80', ARRAY['Alimentos não perecíveis', 'Roupas', 'Voluntários', 'Doação financeira']::text[], 9),
('educandário-sagrados-corações', 'Educandário Sagrados Corações', 'Atendimento a crianças em vulnerabilidade social.', 'Instituição educacional e social que atende crianças em situação de vulnerabilidade no contraturno escolar, oferecendo atividades pedagógicas, culturais, esportivas e de convivência. Seu objetivo é complementar a formação escolar e promover o desenvolvimento integral das crianças, fortalecendo valores sociais e familiares.', 'Rua 6 n. 642 Esq. Av - Centro, Barretos/SP', 'Centro', -20.5588, -48.5692, true, false, '(17) 3322-4478', 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=900&q=80', ARRAY['Alimentos não perecíveis', 'Voluntários', 'Doação financeira', 'Roupas']::text[], 10)
on conflict (id) do nothing;

insert into public.ongs_categorias (ong_id, categoria_id, ordem) values
('aba-barretos', 'animais', 0),
('apae-barretos', 'criancas', 0),
('apae-barretos', 'saude', 1),
('vovo-antonio-barretos', 'idosos', 0),
('vovo-antonio-barretos', 'saude', 1),
('avcc-barretos', 'saude', 0),
('avcc-barretos', 'pessoas', 1),
('nosso-lar-barretos', 'pessoas', 0),
('nosso-lar-barretos', 'alimentos', 1),
('ama-barretos', 'criancas', 0),
('ama-barretos', 'saude', 1),
('instituto-amor', 'pessoas', 0),
('lar-das-criancas', 'criancas', 0),
('casa-transitoria', 'saude', 0),
('casa-transitoria', 'pessoas', 1),
('lions-club', 'pessoas', 0),
('educandário-sagrados-corações', 'criancas', 0)
on conflict (ong_id, categoria_id) do nothing;

commit;
