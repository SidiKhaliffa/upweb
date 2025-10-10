import React, { useState } from 'react';
import './Recette.css';

const Recette = () => {
  const [formData, setFormData] = useState({
    CodeClient: '',
    priseCompta: '',
    Recette_Date: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    console.log('Recette data:', formData);
    if(!formData.Recette_Date){
      alert('Veuillez sélectionner une date de recette.');
      return;
    }
    else if(!formData.priseCompta || isNaN(formData.priseCompta) || Number(formData.priseCompta) <= 0){
      alert('Veuillez entrer un montant de recette valide.');
      return;
    }
    else if(!formData.CodeClient){
      alert('Veuillez entrer un code client.');
      return;
    }
    try{
      const response = await fetch('https://universellepeintre.oneposts.io/api/Stock/recette', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      if(response.ok){
        alert('Recette enregistrée avec succès!');
        setFormData({
          CodeClient: '',
          priseCompta: '',
          Recette_Date: ''
        });
      } else {
        alert('Erreur lors de l\'enregistrement de la recette.');
      }
    }
    catch(error){
      console.error('Error:', error);
      alert('Erreur lors de l\'enregistrement de la recette.');
    }
  };

  return (
    <div className="recette">
      <h1 className="page-title">Recette</h1>
      
      <div className="form-container">
        <div className="form-group">
          <label htmlFor="CodeClient">Code Client</label>
          <input
            type="text"
            id="CodeClient"
            name="CodeClient"
            value={formData.CodeClient}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Entrez le code client"
          />
        </div>

        <div className="form-group">
          <label htmlFor="priseCompta">Montant de la Recette</label>
          <input
            type="number"
            id="priseCompta"
            name="priseCompta"
            value={formData.priseCompta}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Entrez le montant de la recette"
            step="0.01"
          />
        </div>

        <div className="form-group">
          <label htmlFor="Recette_Date">Date de Recette*</label>
          <div className="date-input-container">
            <input
              type="date"
              id="Recette_Date"
              name="Recette_Date"
              value={formData.Recette_Date}
              onChange={handleInputChange}
              className="form-input date-input"
            />
            {/* <Calendar className="date-icon" size={20} /> */}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={handleSubmit} className="submit-btn">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};

export default Recette;