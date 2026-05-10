import { useState } from "react";

export default function AdminContent({
  createAdminService,
  deleteAdminServiceCategory,
  adminContentTab,
  setAdminContentTab,
  loadAdminOperators,
  adminServices,
  adminServiceCategories,
  groupedAdminServices,
  updateAdminServiceField,
  saveAdminService,
  deleteAdminService,
  adminImages,
  cameraInputRefs,
  galleryInputRefs,
  uploadAdminHomeImage,
  uploadingImageId,
  updateAdminImageField,
  saveAdminImage,
  createAdminHomeImage,
  deleteAdminHomeImage,
  adminOperators,
  operatorImageInputRefs,
  uploadAdminOperatorImage,
  createAdminOperator,
  newOperatorName,
  setNewOperatorName,
  newOperatorRole,
  setNewOperatorRole,
  newOperatorSortOrder,
  setNewOperatorSortOrder,
  operatorCreating,
  updateAdminOperatorField,
  operatorSavingId,
  saveAdminOperator,
  operatorDeletingId,
  deleteAdminOperator,
}) {
  const [openServiceCategory, setOpenServiceCategory] = useState("");
  const [openServiceId, setOpenServiceId] = useState("");
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [openNewServiceCategory, setOpenNewServiceCategory] = useState("");
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceDescription, setNewServiceDescription] = useState("");
  const [openPhotoId, setOpenPhotoId] = useState("");
  const [showNewOperatorForm, setShowNewOperatorForm] = useState(false);
  const [openOperatorId, setOpenOperatorId] = useState("");

  return (
    <div className="admin-panel">
      <div className="admin-segmented">
        <button type="button" className={adminContentTab === "services" ? "active" : ""} onClick={() => setAdminContentTab("services")}>
          Servizi e prezzi
        </button>
        <button type="button" className={adminContentTab === "photos" ? "active" : ""} onClick={() => setAdminContentTab("photos")}>
          Foto Home
        </button>
        <button type="button" className={adminContentTab === "operators" ? "active" : ""} onClick={() => {
          setAdminContentTab("operators");
          loadAdminOperators();
        }}>
          Operatori
        </button>
      </div>

      {adminContentTab === "services" && (
        <>
          <div className="section-title">
            <h3>Servizi e prezzi</h3>
            <span>{adminServices.length} servizi</span>
          </div>

          <div className="admin-help-card">
            <strong>Come leggere questa sezione</strong>
            <p>
              Apri una categoria per vedere i servizi. Ogni servizio resta compatto e puoi modificarlo solo quando serve.
            </p>
          </div>

          <div className="admin-service-groups">
            {adminServiceCategories.map((categoryName) => {
              const isOpen = openServiceCategory === categoryName;
              const servicesInCategory = groupedAdminServices[categoryName] || [];

              return (
  <section className="admin-category-block" key={categoryName}>
    <button
      type="button"
      className="admin-category-title admin-category-toggle"
      onClick={() => {
        setOpenServiceCategory(isOpen ? "" : categoryName);
        setOpenServiceId("");
      }}
    >
      <span>Categoria</span>
      <div>
        <strong>{categoryName}</strong>
        <p>{servicesInCategory.length} servizi</p>
      </div>
      <b>{isOpen ? "−" : "+"}</b>
    </button>

    {isOpen && (
      <button
        className="admin-delete-booking-btn"
        type="button"
        onClick={async () => {
          const deleted = await deleteAdminServiceCategory(categoryName);

          if (deleted) {
            setOpenServiceCategory("");
            setOpenServiceId("");
          }
        }}
      >
        Elimina categoria
      </button>
    )}

                  {isOpen && (
                    <>
                      {servicesInCategory.map((item) => {
                        const isServiceOpen = openServiceId === item.id;

                        return (
                          <article className="admin-edit-card" key={item.id}>
                            <div className="admin-card-head">
                              <div className="admin-card-icon">{item.icon || "✂️"}</div>
                              <div>
                                <span>{item.active ? "Attivo" : "Non attivo"}</span>
                                <strong>{item.name || "Servizio senza nome"}</strong>
                                <p>€{item.price}</p>
                              </div>
                            </div>

                            <button
                              className="admin-service-edit-toggle"
                              type="button"
                              onClick={() => setOpenServiceId(isServiceOpen ? "" : item.id)}
                            >
                              {isServiceOpen ? "Chiudi modifica" : "+ Modifica servizio"}
                            </button>

                            {isServiceOpen && (
                              <>
                                <div className="admin-form-grid">
  <div>
    <label>Nome servizio</label>
    <input type="text" value={item.name || ""} onChange={(e) => updateAdminServiceField(item.id, "name", e.target.value)} />
  </div>

  <div>
    <label>Prezzo €</label>
    <input type="number" value={item.price} onChange={(e) => updateAdminServiceField(item.id, "price", e.target.value)} />
  </div>

  <div>
    <label>Ordine</label>
    <input type="number" value={item.sort_order} onChange={(e) => updateAdminServiceField(item.id, "sort_order", e.target.value)} />
  </div>
</div>

<label>Descrizione servizio</label>
<input type="text" value={item.description || ""} onChange={(e) => updateAdminServiceField(item.id, "description", e.target.value)} />

                                <button className="primary-cta" type="button" onClick={() => saveAdminService(item)}>
  Salva servizio
</button>

<button
  className="admin-delete-booking-btn"
  type="button"
  onClick={() => deleteAdminService(item)}
>
  Elimina servizio
</button>
                              </>
                            )}
                          </article>
                        );
                      })}

                      <button
                        className="admin-ghost-card"
                        type="button"
                        onClick={() => {
                          setOpenNewServiceCategory(
                            openNewServiceCategory === categoryName ? "" : categoryName
                          );
                          setNewServiceName("");
                          setNewServicePrice("");
                          setNewServiceDescription("");
                        }}
                      >
                        <span>+</span>
                        <strong>
                          {openNewServiceCategory === categoryName
                            ? "Chiudi nuovo servizio"
                            : "Crea nuovo servizio"}
                        </strong>
                      </button>

                      {openNewServiceCategory === categoryName && (
                        <div className="manual-booking-form">
                          <div className="manual-booking-title">
                            <span>Nuovo servizio</span>
                            <strong>{categoryName}</strong>
                            <p>Crea un servizio dentro questa categoria.</p>
                          </div>

                          <label>Nome servizio</label>
                          <input
                            type="text"
                            value={newServiceName}
                            onChange={(e) => setNewServiceName(e.target.value)}
                            placeholder="Es. Taglio classico"
                          />

                          <label>Prezzo €</label>
                          <input
                            type="number"
                            value={newServicePrice}
                            onChange={(e) => setNewServicePrice(e.target.value)}
                            placeholder="Es. 25"
                          />

                          <label>Descrizione servizio</label>
                          <input
                            type="text"
                            value={newServiceDescription}
                            onChange={(e) => setNewServiceDescription(e.target.value)}
                            placeholder="Breve descrizione visibile al cliente"
                          />

                          <button
                            className="primary-cta"
                            type="button"
                            onClick={async () => {
                              const created = await createAdminService({
                                category: categoryName,
                                category_description: servicesInCategory[0]?.category_description || "",
                                name: newServiceName,
                                description: newServiceDescription,
                                price: newServicePrice,
                                sort_order: servicesInCategory.length + 1,
                              });

                              if (!created) return;

                              setNewServiceName("");
                              setNewServicePrice("");
                              setNewServiceDescription("");
                              setOpenNewServiceCategory("");
                            }}
                          >
                            Crea servizio
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </section>
              );
            })}

            <button
              className="admin-ghost-card admin-ghost-category"
              type="button"
              onClick={() => setShowNewCategoryForm((current) => !current)}
            >
              <span>+</span>
              <strong>
                {showNewCategoryForm ? "Chiudi categoria" : "Aggiungi categoria"}
              </strong>
            </button>

            {showNewCategoryForm && (
              <div className="manual-booking-form">
                <div className="manual-booking-title">
                  <span>Nuova categoria</span>
                  <strong>Crea categoria servizi</strong>
                  <p>
                    La categoria apparirà nella prenotazione clienti.
                  </p>
                </div>

                <label>Nome categoria</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Es. Barba"
                />

                <label>Descrizione categoria</label>
                <input
                  type="text"
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                  placeholder="Es. Rasatura e cura barba"
                />

                <button
                  className="primary-cta"
                  type="button"
                  onClick={async () => {
                    await createAdminService({
                      category: newCategoryName,
                      category_description: newCategoryDescription,
                      name: "Nuovo servizio",
                      description: "",
                      price: 0,
                      sort_order: 0,
                    });

                    setNewCategoryName("");
                    setNewCategoryDescription("");
                    setShowNewCategoryForm(false);
                  }}
                >
                  Crea categoria
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {adminContentTab === "photos" && (
        <>
          <div className="section-title">
            <h3>Foto Home</h3>
            <span>{adminImages.length}/10 immagini</span>
          </div>

          <div className="admin-help-card">
            <strong>Carosello iniziale</strong>
            <p>Scatta una foto al momento oppure caricala dalla galleria del telefono. L’immagine verrà salvata nello Storage e collegata alla Home.</p>
          </div>

          {adminImages.length < 10 && (
  <button
    className="admin-ghost-card"
    type="button"
    onClick={async () => {
      const created = await createAdminHomeImage();

      if (created?.id) {
        setOpenPhotoId(created.id);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }}
  >
    <span>+</span>
    <strong>Aggiungi foto</strong>
  </button>
)}

          {adminImages.length >= 10 && (
            <div className="empty-card compact">
              <strong>Limite immagini raggiunto</strong>
              <p>Puoi gestire massimo 10 immagini nella Home.</p>
            </div>
          )}

          <div className="admin-photo-list">
            {adminImages.map((item) => {
              const isPhotoOpen = openPhotoId === item.id;

              return (
                <article className="admin-edit-card" key={item.id}>
                  <div className="admin-photo-preview">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title || "Foto Home"} />
                    ) : (
                      <div>Nessuna immagine</div>
                    )}
                  </div>

                  <div className="admin-card-head">
                    <div className="admin-card-icon">📷</div>
                    <div>
                      <span>{item.active ? "Visibile in Home" : "Nascosta"}</span>
                      <strong>{item.title || "Foto senza titolo"}</strong>
                      <p>Ordine: {item.sort_order}</p>
                    </div>
                  </div>

                  <button
                    className="admin-service-edit-toggle"
                    type="button"
                    onClick={() => setOpenPhotoId(isPhotoOpen ? "" : item.id)}
                  >
                    {isPhotoOpen ? "Chiudi modifica" : "+ Modifica foto"}
                  </button>

                  <input
                    ref={(element) => {
                      cameraInputRefs.current[item.id] = element;
                    }}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      uploadAdminHomeImage(item, e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />

                  <input
                    ref={(element) => {
                      galleryInputRefs.current[item.id] = element;
                    }}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      uploadAdminHomeImage(item, e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />

                  {isPhotoOpen && (
                    <>
                      <div className="admin-upload-actions">
                        <button className="secondary-cta" type="button" disabled={uploadingImageId === item.id} onClick={() => cameraInputRefs.current[item.id]?.click()}>
                          Scatta foto
                        </button>

                        <button className="secondary-cta" type="button" disabled={uploadingImageId === item.id} onClick={() => galleryInputRefs.current[item.id]?.click()}>
                          Carica da galleria
                        </button>
                      </div>

                      {uploadingImageId === item.id && (
                        <div className="upload-status">
                          Caricamento foto in corso...
                        </div>
                      )}

                      <div className="admin-form-grid">
                        <div>
                          <label>Titolo foto</label>
                          <input type="text" value={item.title || ""} onChange={(e) => updateAdminImageField(item.id, "title", e.target.value)} />
                        </div>

                        <div>
                          <label>Ordine</label>
                          <input type="number" value={item.sort_order} onChange={(e) => updateAdminImageField(item.id, "sort_order", e.target.value)} />
                        </div>
                      </div>

                      <label>URL immagine</label>
                      <input type="text" value={item.image_url || ""} onChange={(e) => updateAdminImageField(item.id, "image_url", e.target.value)} />

                      <label className="admin-toggle-row">
                        <input type="checkbox" checked={item.active} onChange={(e) => updateAdminImageField(item.id, "active", e.target.checked)} />
                        <span>{item.active ? "Immagine visibile in Home" : "Immagine nascosta"}</span>
                      </label>

                      <button className="primary-cta" type="button" onClick={() => saveAdminImage(item)}>
                        Salva immagine
                      </button>

                      <button className="admin-delete-booking-btn" type="button" onClick={() => deleteAdminHomeImage(item)}>
                        Elimina foto
                      </button>
                    </>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}

      {adminContentTab === "operators" && (
        <>
          <div className="section-title">
            <h3>Operatori</h3>
            <span>{adminOperators.length} operatori</span>
          </div>

          <div className="admin-help-card">
            <strong>Operatori del salone</strong>
            <p>Gli operatori attivi saranno visibili al cliente in fase di prenotazione. Ogni operatore ha la propria disponibilità sugli slot.</p>
          </div>

          <button
            className="admin-ghost-card"
            type="button"
            onClick={() => setShowNewOperatorForm((current) => !current)}
          >
            <span>+</span>
            <strong>{showNewOperatorForm ? "Chiudi nuovo operatore" : "Aggiungi operatore"}</strong>
          </button>

          {showNewOperatorForm && (
            <form className="manual-booking-form" onSubmit={createAdminOperator}>
              <div className="manual-booking-title">
                <span>Nuovo operatore</span>
                <strong>Aggiungi barbiere o collaboratore</strong>
                <p>Inserisci il nome che il cliente vedrà durante la prenotazione.</p>
              </div>

              <label>Nome operatore</label>
              <input
                type="text"
                placeholder="Es. Marco"
                value={newOperatorName}
                onChange={(e) => setNewOperatorName(e.target.value)}
                disabled={operatorCreating}
                required
              />

              <label>Ruolo / specializzazione</label>
              <input
                type="text"
                placeholder="Es. Barber, Hair stylist, Barba e rasatura..."
                value={newOperatorRole}
                onChange={(e) => setNewOperatorRole(e.target.value)}
                disabled={operatorCreating}
              />

              <label>Ordine</label>
              <input
                type="number"
                value={newOperatorSortOrder}
                onChange={(e) => setNewOperatorSortOrder(e.target.value)}
                disabled={operatorCreating}
              />

              <button className="primary-cta" type="submit" disabled={operatorCreating}>
                {operatorCreating ? "Creazione..." : "Aggiungi operatore"}
              </button>
            </form>
          )}

          <div className="admin-service-groups">
            {adminOperators.length === 0 ? (
              <div className="empty-card compact">
                <strong>Nessun operatore configurato</strong>
                <p>Aggiungi almeno un operatore per permettere ai clienti di prenotare.</p>
              </div>
            ) : (
              adminOperators.map((item) => {
                const isOperatorOpen = openOperatorId === item.id;

                return (
                  <article className="admin-edit-card" key={item.id}>
                    <div className="admin-card-head">
                      <div
  className="admin-card-icon operator-photo-trigger"
  onClick={() => operatorImageInputRefs.current[item.id]?.click()}
>
  {item.image_url ? (
    <img
      src={item.image_url}
      alt={item.name || "Operatore"}
      className="operator-avatar-image"
    />
  ) : (
    String(item.name || "O").charAt(0).toUpperCase()
  )}
</div>

<input
  ref={(element) => {
    operatorImageInputRefs.current[item.id] = element;
  }}
  type="file"
  accept="image/*"
  style={{ display: "none" }}
  onChange={(e) => {
    uploadAdminOperatorImage(item, e.target.files?.[0]);
    e.target.value = "";
  }}
/>

<div>
  <span>{item.active ? "Attivo" : "Non attivo"}</span>
  <strong>{item.name || "Operatore senza nome"}</strong>
  <p>{item.role || "Nessun ruolo inserito"}</p>
</div>
                    </div>

                    <button
                      className="admin-service-edit-toggle"
                      type="button"
                      onClick={() => setOpenOperatorId(isOperatorOpen ? "" : item.id)}
                    >
                      {isOperatorOpen ? "Chiudi modifica" : "+ Modifica operatore"}
                    </button>

                    {isOperatorOpen && (
                      <>
                        <div className="admin-form-grid">
                          <div>
                            <label>Nome</label>
                            <input type="text" value={item.name || ""} onChange={(e) => updateAdminOperatorField(item.id, "name", e.target.value)} />
                          </div>

                          <div>
                            <label>Ruolo</label>
                            <input type="text" value={item.role || ""} onChange={(e) => updateAdminOperatorField(item.id, "role", e.target.value)} />
                          </div>

                          <div>
                            <label>Ordine</label>
                            <input type="number" value={item.sort_order || 0} onChange={(e) => updateAdminOperatorField(item.id, "sort_order", e.target.value)} />
                          </div>
                        </div>

                        <label className="admin-toggle-row">
                          <input type="checkbox" checked={Boolean(item.active)} onChange={(e) => updateAdminOperatorField(item.id, "active", e.target.checked)} />
                          <span>{item.active ? "Visibile ai clienti" : "Nascosto ai clienti"}</span>
                        </label>

                        <button className="primary-cta" type="button" disabled={operatorSavingId === item.id} onClick={() => saveAdminOperator(item)}>
                          {operatorSavingId === item.id ? "Salvataggio..." : "Salva operatore"}
                        </button>

                        <button className="admin-delete-booking-btn" type="button" disabled={operatorDeletingId === item.id} onClick={() => deleteAdminOperator(item)}>
                          {operatorDeletingId === item.id ? "Eliminazione..." : "Elimina operatore"}
                        </button>
                      </>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}