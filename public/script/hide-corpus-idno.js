$( document ).ready( function() {
    $("#letter_details dt").each(function() {
        if ($(this).nextUntil("dt").not(".d-none").length > 0) {
            $(this).removeClass("d-none");
        }
        else {$(this).addClass("d-none");}
    });
    $(".tab-list li a").click(function(e){
        e.preventDefault();
    });

    $(".tab-list li").click(function(){
        var tabid = $(this).find("a").attr("href");
        var current_tab = $(".tab-list li a.active").attr("href").replace(/^#/,'.');
        var desired_tab = tabid.replace(/^#/,'.');
        var current_tab = $(".tab-list li a.active").attr("href").replace(/^#/,'.');
        $(".metadata"+current_tab).fadeToggle('fast').addClass("d-none");
        $(".metadata"+desired_tab).fadeToggle('fast').removeClass("d-none");
        $("#letter_details dt").each(function() {
            if ($(this).nextUntil("dt").not(".d-none").length > 0) {
                $(this).removeClass("d-none");
            }
            else {$(this).addClass("d-none");}
        });
        $(".tab-list li a").removeClass("active");
        $(".tab-pane.active").hide().removeClass("active").addClass("inactive");
        $(tabid).fadeToggle('fast').addClass("active").removeClass("inactive");
        $(this).find("a").addClass('active');
    });
});
