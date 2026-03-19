import { useState, useEffect } from 'react';
import { 
  Container, Title, TextInput, NumberInput, Select, Textarea, 
  Button, Group, Stack, Paper, ActionIcon, Text, FileInput, Badge
} from '@mantine/core';
import { Plus, Trash, Camera, Save, Tag, X, GitFork } from 'lucide-react';
import { notifications } from '@mantine/notifications';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../Service/api';

const CreateRecipe = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const editRecipe = location.state?.editRecipe || null;
  const original = location.state?.originalRecipe || null;
  const parentId = location.state?.parentId || null;
  const isEditing = !!editRecipe;

  // AGGIUNTO: Stato per gestire l'input del tag in modo reattivo
  const [tagInputValue, setTagInputValue] = useState('');

  const [formData, setFormData] = useState({
    titolo: '',
    descrizione: '',
    difficolta: 'FACILE',
    tempoPrep: 15,
    tempoCottura: 0,
    parentRecipeId: null,
    ingredienti: [{ nome: '', quantita: '' }],
    steps: [{ ordine: 1, descrizione: '' }],
    tags: []
  });

  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    const source = editRecipe || original;
    if (source) {
      let baseTags = source.tags?.map(t => typeof t === 'object' ? (t.nome || t.value) : t) || [];
      
      if (parentId && !isEditing && !baseTags.includes('Variante')) {
        baseTags = [...baseTags, 'Variante'];
      }

      setFormData({
        titolo: source.titolo || '', 
        descrizione: source.descrizione || '',
        difficolta: source.difficolta || 'FACILE',
        tempoPrep: source.tempoPrep || 15,
        tempoCottura: source.tempoCottura || 0,
        parentRecipeId: isEditing ? source.parentRecipe?.id : parentId,
        ingredienti: source.ingredienti?.map(i => ({ nome: i.nome, quantita: i.quantita })) || [{ nome: '', quantita: '' }],
        steps: source.steps?.map(s => ({ ordine: s.ordine, descrizione: s.descrizione })) || [{ ordine: 1, descrizione: '' }],
        tags: baseTags
      });
    }
  }, [editRecipe, original, isEditing, parentId]);

  // LOGICA CORRETTA: Usa il parametro passato o lo stato dell'input
  const handleAddTag = (val) => {
    const cleanVal = val?.trim();
    if (!cleanVal) return;

    if (!parentId && cleanVal.toLowerCase() === 'variante') {
      notifications.show({ 
        title: 'Azione non consentita',
        message: 'Il tag "Variante" è riservato alle fork automatiche.', 
        color: 'red' 
      });
      return;
    }

    if (!formData.tags.includes(cleanVal)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, cleanVal] }));
    }
    setTagInputValue(''); // Pulisce l'input
  };

  const removeTag = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, index) => index !== indexToRemove)
    }));
  };

  const addIngredient = () => setFormData({...formData, ingredienti: [...formData.ingredienti, { nome: '', quantita: '' }]});
  const addStep = () => setFormData({...formData, steps: [...formData.steps, { ordine: formData.steps.length + 1, descrizione: '' }]});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const cleanFormData = {
      ...formData,
      tags: formData.tags.map(tag => (typeof tag === 'object') ? (tag.value || tag.nome) : tag)
    };

    try {
      let res;
      if (isEditing) {
        res = await api.put(`/recipes/${editRecipe.id}`, cleanFormData);
      } else {
        res = await api.post('/recipes/create', cleanFormData);
      }

      const recipeId = isEditing ? editRecipe.id : res.data.id;

      if (imageFile) {
        const imgData = new FormData();
        imgData.append('immagine', imageFile);
        await api.patch(`/recipes/${recipeId}/image`, imgData);
      }

      notifications.show({ title: 'Successo!', message: isEditing ? 'Ricetta aggiornata' : 'Ricetta pubblicata', color: 'green' });
      navigate(`/recipes/${recipeId}`);
    } catch (error) {
      console.error("Errore invio:", error);
      notifications.show({ title: 'Errore', message: 'Controlla i dati inseriti', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="md" pt={40} pb={100}>
      
      <Stack gap="xs" mb="xl">
        <Title order={1} fw={900} lts={-1}>
          {isEditing ? `Modifica Ricetta` : (parentId ? 'Crea una Variante' : 'Nuova Ricetta')}
        </Title>
        
        {parentId && !isEditing && (
          <Paper withBorder p="sm" radius="md" bg="teal.0" style={{ borderColor: 'var(--mantine-color-teal-2)' }}>
            <Group gap="xs">
              <Badge color="teal" variant="filled" leftSection={<GitFork size={12} />}>Fork</Badge>
              <Text size="sm">
                Stai creando una variante di <strong>{original?.titolo}</strong> di <i>{original?.user?.username}</i>
              </Text>
            </Group>
          </Paper>
        )}
      </Stack>

      <form onSubmit={handleSubmit}>
        <Stack gap="xl">
          <Paper withBorder p="xl" radius="md" shadow="xs">
            <Stack gap="md">
              <Title order={4} c="orange">Dettagli Principali</Title>
              <TextInput 
                label="Titolo" required placeholder="Es: Risotto alla Milanese"
                value={formData.titolo} onChange={(e) => setFormData({...formData, titolo: e.target.value})} 
              />
              <Textarea 
                label="Descrizione" required placeholder="Racconta la tua versione del piatto..."
                value={formData.descrizione} onChange={(e) => setFormData({...formData, descrizione: e.target.value})} 
              />
              
              <Stack gap="xs">
                <Text size="sm" fw={500}>Tag della ricetta</Text>
                <Group align="flex-end">
                  <TextInput
                    placeholder="Premi Invio per aggiungere un tag"
                    style={{ flex: 1 }}
                    value={tagInputValue}
                    onChange={(e) => setTagInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag(tagInputValue);
                      }
                    }}
                  />
                  <Button color="orange" variant="light" onClick={() => handleAddTag(tagInputValue)}>
                    Aggiungi
                  </Button>
                </Group>
                
                <Group gap="xs" mt="xs">
                  {formData.tags.map((tag, index) => {
                    const isProtected = tag === 'Variante';
                    return (
                      <Badge 
                        key={`${tag}-${index}`} 
                        variant="filled" 
                        color={isProtected ? 'teal' : 'orange'} 
                        size="lg"
                        rightSection={!isProtected && (
                          <ActionIcon size="xs" color="white" variant="transparent" onClick={() => removeTag(index)}>
                            <X size={12} />
                          </ActionIcon>
                        )}
                      >
                        {tag}
                      </Badge>
                    );
                  })}
                </Group>
              </Stack>

              <Group grow>
                <Select label="Difficoltà" data={['FACILE', 'MEDIA', 'DIFFICILE']} value={formData.difficolta} onChange={(val) => setFormData({...formData, difficolta: val})} />
                <NumberInput label="Prep. (min)" value={formData.tempoPrep} onChange={(val) => setFormData({...formData, tempoPrep: val})} />
                <NumberInput label="Cottura (min)" value={formData.tempoCottura} onChange={(val) => setFormData({...formData, tempoCottura: val})} />
              </Group>
              {!isEditing && <FileInput label="Foto del Piatto" placeholder="Scegli file" leftSection={<Camera size={18}/>} onChange={setImageFile} accept="image/*" />}
            </Stack>
          </Paper>

          <Paper withBorder p="xl" radius="md">
            <Group justify="space-between" mb="md">
              <Title order={4} c="orange">Ingredienti</Title>
              <Button size="xs" variant="outline" color="orange" onClick={addIngredient} leftSection={<Plus size={14}/>}>Aggiungi</Button>
            </Group>
            {formData.ingredienti.map((ing, i) => (
              <Group key={i} mb="xs" grow>
                <TextInput placeholder="Nome" value={ing.nome} onChange={(e) => {
                  const newI = [...formData.ingredienti]; newI[i].nome = e.target.value; setFormData({...formData, ingredienti: newI});
                }} />
                <TextInput placeholder="Quantità" value={ing.quantita} onChange={(e) => {
                  const newI = [...formData.ingredienti]; newI[i].quantita = e.target.value; setFormData({...formData, ingredienti: newI});
                }} />
                <ActionIcon color="red" variant="subtle" onClick={() => setFormData({...formData, ingredienti: formData.ingredienti.filter((_, idx) => idx !== i)})} disabled={formData.ingredienti.length === 1}>
                  <Trash size={16}/>
                </ActionIcon>
              </Group>
            ))}
          </Paper>

          <Paper withBorder p="xl" radius="md">
            <Group justify="space-between" mb="md">
              <Title order={4} c="orange">Procedimento</Title>
              <Button size="xs" variant="outline" color="orange" onClick={addStep} leftSection={<Plus size={14}/>}>Aggiungi Step</Button>
            </Group>
            <Stack gap="md">
              {formData.steps.map((step, index) => (
                <Group key={index} align="flex-start" wrap="nowrap">
                  <Badge variant="filled" color="orange" size="lg" circle mt={8}>{index + 1}</Badge>
                  <Textarea 
                    style={{ flex: 1 }} value={step.descrizione} 
                    onChange={(e) => {
                      const newS = [...formData.steps]; newS[index].descrizione = e.target.value; setFormData({...formData, steps: newS});
                    }} 
                    autosize minRows={2}
                  />
                  <ActionIcon color="red" variant="subtle" mt={8} onClick={() => setFormData({...formData, steps: formData.steps.filter((_, idx) => idx !== index)})} disabled={formData.steps.length === 1}>
                    <Trash size={16}/>
                  </ActionIcon>
                </Group>
              ))}
            </Stack>
          </Paper>

          <Button type="submit" size="lg" color="orange" loading={loading} fullWidth leftSection={<Save size={20}/>}>
            {isEditing ? 'Salva Modifiche' : 'Pubblica Ricetta'}
          </Button>
        </Stack>
      </form>
    </Container>
  );
};

export default CreateRecipe;