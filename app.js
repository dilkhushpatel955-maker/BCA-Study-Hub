import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut, sendPasswordResetEmail, updateProfile
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp,
  doc, getDoc, setDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import {
  getStorage, ref, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-storage.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const subjects = [
  {code:"BCA-101",name:"Communicative English",topics:"Business and government correspondence, writing skills, grammar, short stories, job preparation."},
  {code:"BCA-102",name:"Basic Mathematics",topics:"Symbolic logic, set theory, differential and integral calculus, analytical geometry."},
  {code:"BCA-103",name:"Information Technology and Application",topics:"Computer fundamentals, I/O devices, memory, software, operating systems, networks and MS Office."},
  {code:"BCA-104",name:"Principles of Management & Organization",topics:"Management theories, planning, organization, staffing, directing and controlling."},
  {code:"BCA-105",name:"Python Programming (Elective 1)",topics:"Python basics, variables, loops, conditions, functions, lists, dictionaries, files and GUI."},
  {code:"BCA-106",name:"Problem Solving and Programming Concepts (Elective 2)",topics:"Algorithms, flowcharts, logic structures, loops, arrays, searching, sorting and applications."},
  {code:"BCA-107",name:"Lab (BCA-103)",topics:"Information Technology practicals."},
  {code:"BCA-108",name:"Lab (BCA-105)",topics:"Python programming practicals."},
  {code:"BCA-109",name:"Lab (BCA-106)",topics:"Problem-solving and programming practicals."}
];

const $ = id => document.getElementById(id);
let mode = "login", currentUser = null, isAdmin = false, materials = [];
const subjectOptions = subjects.map(s => `<option value="${s.code}">${s.code} — ${s.name}</option>`).join("");
$("materialSubject").innerHTML = subjectOptions;
$("subjectFilter").insertAdjacentHTML("beforeend", subjectOptions);

function showMessage(id, text, type="") {
  const el = $(id); el.textContent = text; el.className = `message ${type}`;
}
function toast(text) {
  const el = $("toast"); el.textContent = text; el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2600);
}
function escapeHtml(value="") {
  return String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
function renderSubjects() {
  $("subjectsGrid").innerHTML = subjects.map(s => `<article class="subject-card">
    <div class="subject-code">${s.code}</div><h3>${s.name}</h3><p>${s.topics}</p>
    <div class="topics">View related materials ↓</div>
  </article>`).join("");
}
function setMode(next) {
  mode = next;
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.mode === mode));
  $("authTitle").textContent = mode === "login" ? "Welcome back" : "Create your account";
  $("authSubtitle").textContent = mode === "login" ? "Sign in to access your study material." : "Join your classmates on BCA Study Hub.";
  $("authSubmit").textContent = mode === "login" ? "Login" : "Create account";
  $("authName").classList.toggle("hidden", mode === "login");
  $("nameLabel").classList.toggle("hidden", mode === "login");
  $("authName").required = mode === "signup";
  $("resetPassword").classList.toggle("hidden", mode !== "login");
  showMessage("authMessage", "");
}
document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", () => setMode(t.dataset.mode)));
$("authForm").addEventListener("submit", async e => {
  e.preventDefault(); showMessage("authMessage", "Please wait…");
  const email = $("authEmail").value.trim(), password = $("authPassword").value;
  try {
    if (mode === "signup") {
      const name = $("authName").value.trim();
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, {displayName:name});
      // Create a profile without any role field. Only the project owner should assign admin.
      await setDoc(doc(db, "users", credential.user.uid), {name, email, createdAt:serverTimestamp()});
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
  } catch (err) { showMessage("authMessage", friendlyError(err), "error"); }
});
$("resetPassword").addEventListener("click", async () => {
  const email = $("authEmail").value.trim();
  if (!email) return showMessage("authMessage", "Enter your email address first.", "error");
  try { await sendPasswordResetEmail(auth, email); showMessage("authMessage", "Password reset email sent.", "success"); }
  catch (err) { showMessage("authMessage", friendlyError(err), "error"); }
});
$("signOutBtn").addEventListener("click", () => signOut(auth));
function friendlyError(err) {
  const map = {
    "auth/email-already-in-use":"This email is already registered.",
    "auth/invalid-email":"Please enter a valid email address.",
    "auth/weak-password":"Use a stronger password (at least 6 characters).",
    "auth/invalid-credential":"Email or password is incorrect.",
    "auth/network-request-failed":"Network error. Check your internet connection."
  };
  return map[err.code] || err.message || "Something went wrong.";
}
function renderMaterials() {
  const search = $("searchMaterials").value.trim().toLowerCase();
  const sub = $("subjectFilter").value, type = $("typeFilter").value;
  const filtered = materials.filter(m =>
    (!sub || m.subject === sub) && (!type || m.type === type) &&
    (!search || `${m.title} ${m.description||""} ${m.subject} ${m.type}`.toLowerCase().includes(search))
  );
  if (!filtered.length) {
    $("materialsList").innerHTML = `<div class="empty-state">${materials.length ? "No materials match your search." : "No materials uploaded yet. Admin can add notes and PDFs below."}</div>`;
    return;
  }
  $("materialsList").innerHTML = filtered.map(m => {
    const subjectName = subjects.find(s => s.code === m.subject)?.name || m.subject || "General";
    const url = m.url || "#";
    return `<article class="material-card">
      <div class="file-icon">${m.type === "Link" ? "🔗" : m.type === "Practical" ? "💻" : "📄"}</div>
      <div class="material-main"><h3>${escapeHtml(m.title)}</h3><p>${escapeHtml(m.description || "Study material for BCA students.")}</p>
      <div class="material-meta">${escapeHtml(m.subject)} · ${escapeHtml(subjectName)} · ${escapeHtml(m.type)}</div></div>
      <div class="material-actions"><a class="open-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Open ↗</a>
      ${isAdmin ? `<button class="delete-btn" data-delete="${escapeHtml(m.id)}">Delete</button>` : ""}</div>
    </article>`;
  }).join("");
  document.querySelectorAll("[data-delete]").forEach(btn => btn.addEventListener("click", () => removeMaterial(btn.dataset.delete)));
}
["searchMaterials","subjectFilter","typeFilter"].forEach(id => $(id).addEventListener(id==="searchMaterials"?"input":"change", renderMaterials));

async function loadMaterials() {
  try {
    const snap = await getDocs(query(collection(db, "materials"), orderBy("createdAt", "desc")));
    materials = snap.docs.map(d => ({id:d.id, ...d.data()}));
    renderMaterials();
  } catch (err) {
    $("materialsList").innerHTML = `<div class="empty-state">Could not load materials. Check Firestore setup and security rules.</div>`;
    console.error(err);
  }
}
async function removeMaterial(id) {
  if (!isAdmin || !confirm("Delete this material?")) return;
  const item = materials.find(m => m.id === id);
  try {
    await deleteDoc(doc(db, "materials", id));
    if (item?.storagePath) {
      try { await deleteObject(ref(storage, item.storagePath)); } catch (e) { console.warn("Storage file could not be deleted", e); }
    }
    materials = materials.filter(m => m.id !== id); renderMaterials(); toast("Material deleted.");
  } catch (err) { toast("Delete failed. Check admin permissions."); console.error(err); }
}
$("uploadForm").addEventListener("submit", async e => {
  e.preventDefault();
  if (!currentUser || !isAdmin) return showMessage("uploadMessage", "Admin access is required.", "error");
  showMessage("uploadMessage", "Publishing…");
  const file = $("materialFile").files[0], externalUrl = $("materialUrl").value.trim();
  if (!file && !externalUrl) return showMessage("uploadMessage", "Choose a file or paste a link.", "error");
  if (file && file.size > 20 * 1024 * 1024) return showMessage("uploadMessage", "File must be 20 MB or smaller.", "error");
  try {
    let url = externalUrl, storagePath = "";
    if (file) {
      storagePath = `materials/${currentUser.uid}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`;
      const fileRef = ref(storage, storagePath);
      await uploadBytes(fileRef, file, {contentType:file.type || "application/octet-stream"});
      url = await getDownloadURL(fileRef);
    }
    await addDoc(collection(db, "materials"), {
      title:$("materialTitle").value.trim(), subject:$("materialSubject").value,
      type:$("materialType").value, description:$("materialDescription").value.trim(),
      url, storagePath, uploadedBy:currentUser.uid, createdAt:serverTimestamp()
    });
    $("uploadForm").reset(); await loadMaterials();
    showMessage("uploadMessage", "Material published successfully.", "success"); toast("Material added for students.");
  } catch (err) {
    showMessage("uploadMessage", "Upload failed. Check Firebase Storage/Firestore rules.", "error");
    console.error(err);
  }
});

onAuthStateChanged(auth, async user => {
  currentUser = user; isAdmin = false;
  if (!user) {
    $("authSection").classList.remove("hidden"); $("appSection").classList.add("hidden");
    $("signOutBtn").classList.add("hidden"); $("userLabel").textContent = "Not signed in";
    return;
  }
  $("authSection").classList.add("hidden"); $("appSection").classList.remove("hidden");
  $("signOutBtn").classList.remove("hidden"); $("userLabel").textContent = user.email || "Signed in";
  $("welcomeName").textContent = user.displayName || user.email?.split("@")[0] || "Student";
  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    isAdmin = userDoc.exists() && userDoc.data().role === "admin";
  } catch (err) { console.warn("Could not read user profile", err); }
  $("adminPanel").classList.toggle("hidden", !isAdmin);
  $("adminBadge").classList.toggle("hidden", !isAdmin);
  renderSubjects(); await loadMaterials();
});
renderSubjects();
