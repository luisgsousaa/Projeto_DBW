
//impede a submissão de um comentario vazio
document.addEventListener('DOMContentLoaded', function() {
    const commentForm = document.querySelector('form.comment-section');
    commentForm.addEventListener('submit', function(e) {
        const comment = document.getElementById('comment');

        if (comment.value.trim().length === 0) {
            e.preventDefault();
        }
    });
});